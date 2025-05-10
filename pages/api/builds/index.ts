import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// 커리어 생성/수정 스키마
const buildSchema = z.object({
  title: z.string().min(1, '활동명을 입력해주세요'),
  description: z.string().min(1, '활동 내용을 입력해주세요'),
  duration_start: z.string().min(1, '시작일을 입력해주세요'),
  duration_end: z.string().optional(),
  category: z.string().min(1, '분류를 선택해주세요'),
  tags: z.array(z.string()).max(5, '태그는 최대 5개까지 추가할 수 있습니다').optional(),
  image_url: z.string().optional(),
  is_public: z.boolean().default(true),
});

type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    }

    // GET 요청 처리 (커리어 목록 조회)
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('builds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      return res.status(200).json({
        success: true,
        data,
      });
    }
    
    // POST 요청 처리 (새 커리어 생성)
    if (req.method === 'POST') {
      // 요청 데이터 검증
      const validationResult = buildSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.errors[0].message,
        });
      }
      
      const buildData = validationResult.data;
      
      // 커리어 항목 생성
      const { data, error: createError } = await supabaseAdmin
        .from('builds')
        .insert({
          ...buildData,
          user_id: user.id,
        })
        .select('*')
        .single();
        
      if (createError) {
        return res.status(400).json({
          success: false,
          error: createError.message,
        });
      }
      
      return res.status(201).json({
        success: true,
        message: '커리어 항목이 성공적으로 생성되었습니다.',
        data,
      });
    }
    
    // 허용되지 않은 메소드
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  } catch (error: any) {
    console.error('커리어 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 