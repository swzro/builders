import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// 커리어 수정 스키마
const buildUpdateSchema = z.object({
  title: z.string().min(1, '활동명을 입력해주세요').optional(),
  description: z.string().min(1, '활동 내용을 입력해주세요').optional(),
  duration_start: z.string().min(1, '시작일을 입력해주세요').optional(),
  duration_end: z.string().optional(),
  category: z.string().min(1, '분류를 선택해주세요').optional(),
  tags: z.array(z.string()).max(5, '태그는 최대 5개까지 추가할 수 있습니다').optional(),
  image_url: z.string().optional(),
  is_public: z.boolean().optional(),
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
  // 커리어 항목 ID 추출
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      error: '유효하지 않은 커리어 항목 ID입니다.',
    });
  }

  try {
    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    }

    // 먼저 해당 커리어 항목이 현재 사용자의 것인지 확인
    const { data: buildItem, error: fetchError } = await supabaseAdmin
      .from('builds')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: '해당 커리어 항목을 찾을 수 없습니다.',
      });
    }
    
    // 권한 확인 (자신의 커리어 항목인지)
    if (buildItem.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: '이 작업을 수행할 권한이 없습니다.',
      });
    }

    // GET 요청 처리 (단일 커리어 항목 조회)
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: buildItem,
      });
    }
    
    // PATCH 요청 처리 (커리어 항목 수정)
    if (req.method === 'PATCH') {
      // 요청 데이터 검증
      const validationResult = buildUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.errors[0].message,
        });
      }
      
      const updateData = validationResult.data;
      
      // 커리어 항목 업데이트
      const { data, error: updateError } = await supabaseAdmin
        .from('builds')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
        
      if (updateError) {
        return res.status(400).json({
          success: false,
          error: updateError.message,
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '커리어 항목이 성공적으로 업데이트되었습니다.',
        data,
      });
    }
    
    // DELETE 요청 처리 (커리어 항목 삭제)
    if (req.method === 'DELETE') {
      const { error: deleteError } = await supabaseAdmin
        .from('builds')
        .delete()
        .eq('id', id);
        
      if (deleteError) {
        return res.status(400).json({
          success: false,
          error: deleteError.message,
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '커리어 항목이 성공적으로 삭제되었습니다.',
      });
    }
    
    // 허용되지 않은 메소드
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  } catch (error: any) {
    console.error('커리어 항목 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 