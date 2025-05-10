import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// 요청 스키마 정의
const loginRequestSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type ResponseData = {
  success: boolean;
  message?: string;
  user?: any;
  session?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // POST 메소드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // 요청 데이터 검증
    const validationResult = loginRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
      });
    }

    const { email, password } = validationResult.data;
    
    console.log('로그인 요청:', { email });
    
    // 로그인 시도
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('로그인 에러:', error);
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    console.log('로그인 성공:', { 
      user: data.user?.id,
      session: !!data.session,
      expires_at: data.session?.expires_at
    });

    // 세션 토큰을 쿠키로 설정
    if (data.session) {
      // 클라이언트 측에서 토큰 저장
      res.setHeader('Set-Cookie', [
        `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
        `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      user: data.user,
      session: {
        expires_at: data.session?.expires_at
      },
    });
  } catch (error: any) {
    console.error('로그인 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 