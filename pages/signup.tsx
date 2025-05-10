import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import SignupForm from '@/components/auth/SignupForm';
import { getClient } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 이미 로그인되어 있으면 대시보드로 리다이렉트
    const checkUser = async () => {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkUser();
  }, [router]);
  
  return (
    <Layout title="회원가입 - Builders">
      <Head>
        <meta name="description" content="Builders 계정을 만들고 포트폴리오를 시작하세요." />
      </Head>
      
      <div className="container mx-auto py-12 px-4">
        <SignupForm />
      </div>
    </Layout>
  );
} 