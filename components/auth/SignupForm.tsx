import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupSchema } from '@/utils/validation';
import { cn } from '@/lib/utils';
import axios from 'axios';

type FormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // API 엔드포인트를 통해 회원가입 처리
      const response = await axios.post('/api/auth/signup', {
        email: values.email,
        password: values.password,
      });
      
      // 회원가입 성공
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-text">회원가입 완료</h1>
          <p className="text-brand-subtext mt-2">
            이메일로 인증 링크가 발송되었습니다.<br />
            이메일을 확인하고 인증을 완료해 주세요.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-brand-primary hover:underline"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-text">회원가입</h1>
        <p className="text-brand-subtext mt-2">
          새 계정을 만들고 포트폴리오를 시작하세요.
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
        
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-brand-text"
          >
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={cn(
              "w-full px-3 py-2 border rounded-md bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary",
              errors.confirmPassword ? "border-brand-error" : "border-brand-border"
            )}
            disabled={loading}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-brand-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full py-2 px-4 rounded-md bg-brand-primary text-brand-text font-medium",
            "hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>
      
      <div className="text-center text-sm">
        <p className="text-brand-text">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-brand-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
} 