import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import BuildWizard from '@/components/build/wizard/BuildWizard';
import { getClient } from '@/lib/supabase';

export default function NewBuildPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
          router.push('/login');
          return;
        }
        
        setUser(session.user);
      } catch (err: any) {
        console.error('인증 오류:', err);
        setError(err.message || '인증 확인 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Build 생성 완료 처리
  const handleBuildComplete = () => {
    router.push('/builds');
  };
  
  return (
    <>
      <Head>
        <title>새 Build 만들기 | Builders</title>
        <meta name="description" content="새로운 빌드를 생성하고 포트폴리오에 추가하세요." />
      </Head>
      
      <Layout>
        {loading ? (
          <div className="container max-w-4xl mx-auto px-4 py-12">
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin"></div>
              </div>
              <p className="mt-4 text-brand-textSecondary">로딩 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="container max-w-4xl mx-auto px-4 py-12">
            <div className="bg-brand-error/10 p-4 rounded-md text-sm text-brand-error border border-brand-error/20">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{error}</span>
              </div>
            </div>
          </div>
        ) : user ? (
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <BuildWizard userId={user.id} onComplete={handleBuildComplete} />
          </div>
        ) : null}
      </Layout>
    </>
  );
} 