import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// 요청 스키마 정의
const signupRequestSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  username: z.string().min(3, '사용자명은 최소 3자 이상이어야 합니다').optional(),
});

type ResponseData = {
  success: boolean;
  message?: string;
  user?: any;
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
    const validationResult = signupRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
      });
    }

    const { email, password, username } = validationResult.data;
    
    // 회원가입 진행
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin}/onboarding`,
        data: {
          username: username || email.split('@')[0], // 사용자가 제공하지 않은 경우 이메일에서 기본 username 생성
        },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // 회원가입 후 사용자 프로필 데이터 생성
    if (data.user) {
      const defaultUsername = username || email.split('@')[0];
      // users 테이블에 기본 프로필 생성 (id, email, username)
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          username: defaultUsername,
          created_at: new Date().toISOString(),
        });
      if (profileError) {
        console.error('프로필 생성 오류:', profileError);
        // 프로필 생성에 실패해도 회원가입은 성공으로 처리
      }
    }

    return res.status(200).json({
      success: true,
      message: '회원가입 성공. 이메일 인증을 진행해주세요.',
      user: data.user,
    });
  } catch (error: any) {
    console.error('회원가입 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 