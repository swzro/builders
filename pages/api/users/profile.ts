import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// 교육 항목 스키마
const educationItemSchema = z.object({
  institution: z.string().min(1, '기관명을 입력해주세요'),
  degree: z.string().min(1, '학위를 입력해주세요'),
  field: z.string().optional(),
  start_date: z.string().min(1, '시작일을 입력해주세요'),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
});

// 언어 항목 스키마
const languageItemSchema = z.object({
  name: z.string().min(1, '언어명을 입력해주세요'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
});

// 스킬 카테고리 스키마
const skillCategorySchema = z.object({
  category: z.string().min(1, '카테고리명을 입력해주세요'),
  items: z.array(z.string()).min(1, '최소 1개 이상의 스킬을 입력해주세요'),
});

// 프로필 업데이트 스키마
const profileUpdateSchema = z.object({
  username: z.string().min(3, '사용자명은 최소 3자 이상이어야 합니다').optional(),
  name: z.string().min(1, '이름을 입력해주세요').optional(),
  bio: z.string().max(160, '자기소개는 최대 160자까지 가능합니다').optional(),
  education: z.array(educationItemSchema).optional(),
  language: z.array(languageItemSchema).optional(),
  etc: z.string().max(300, '기타 정보는 최대 300자까지 가능합니다').optional(),
  skills: z.array(skillCategorySchema).optional(),
});

type ResponseData = {
  success: boolean;
  message?: string;
  profile?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // 현재 로그인한 사용자 확인 (토큰 기반)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    }

    // GET 요청 처리 (프로필 조회)
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      return res.status(200).json({
        success: true,
        profile: data,
      });
    }
    
    // PATCH 요청 처리 (프로필 업데이트)
    if (req.method === 'PATCH') {
      // 요청 데이터 검증
      const validationResult = profileUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.errors[0].message,
        });
      }
      
      const updateData = validationResult.data;
      
      // 사용자명 중복 체크 (사용자명이 수정되는 경우에만)
      if (updateData.username) {
        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('username', updateData.username)
          .neq('id', user.id)
          .single();
          
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: '이미 사용 중인 사용자명입니다.',
          });
        }
      }
      
      // 프로필 업데이트
      const { data, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', user.id)
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
        message: '프로필이 업데이트되었습니다.',
        profile: data,
      });
    }
    
    // 허용되지 않은 메소드
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  } catch (error: any) {
    console.error('프로필 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 