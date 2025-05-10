import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '@/utils/validation';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/supabase';

type FormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data?.session) {
        setError('로그인 세션을 생성할 수 없습니다.');
        setLoading(false);
        return;
      }

      if (data.session.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
        console.log('토큰 저장됨:', data.session.access_token.substring(0, 10) + '...');
      } else {
        console.warn('액세스 토큰이 없습니다.');
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profileData) {
          router.push('/onboarding');
          return;
        }

        router.push('/dashboard');
      } catch (profileErr) {
        console.error('프로필 확인 중 오류:', profileErr);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-text">로그인</h1>
        <p className="text-brand-subtext mt-2">
          계정에 로그인하고 포트폴리오를 관리하세요.
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-brand-error/10 p-3 rounded-md text-sm text-brand-error">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-brand-text"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={cn(
              "w-full px-3 py-2 border rounded-md bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary",
              errors.email ? "border-brand-error" : "border-brand-border"
            )}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-brand-error">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-brand-text"
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className={cn(
              "w-full px-3 py-2 border rounded-md bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary",
              errors.password ? "border-brand-error" : "border-brand-border"
            )}
            disabled={loading}
          />
          {errors.password && (
            <p className="text-sm text-brand-error">{errors.password.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full py-2 px-4 rounded-md bg-brand-primary text-white font-medium",
            "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-base",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      
      <div className="text-center text-sm">
        <p className="text-brand-subtext">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-brand-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
} 