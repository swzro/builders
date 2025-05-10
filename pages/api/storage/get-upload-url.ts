import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// 요청 스키마
const uploadUrlSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  file_name: z.string(),
  content_type: z.string().optional()
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
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  }

  try {
    // 현재 로그인한 사용자 확인
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError || !userData?.user) {
      return res.status(401).json({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    }
    
    // 요청 데이터 검증
    const validationResult = uploadUrlSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
      });
    }
    
    const { bucket, path, file_name, content_type } = validationResult.data;
    
    // 파일 경로 생성
    const filePath = `${path}/${file_name}`;
    
    // 업로드 URL 생성
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: `업로드 URL 생성 실패: ${error.message}`,
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error('업로드 URL 생성 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 