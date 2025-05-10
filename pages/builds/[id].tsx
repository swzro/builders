import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import SmartBuildForm from '@/components/build/SmartBuildForm';
import { getClient } from '@/lib/supabase';
import { Build } from '@/types/build';

export default function EditBuildPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [user, setUser] = useState<any>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuthAndFetchBuild = async () => {
      try {
        if (!id) return; // id가 아직 없으면 리턴
        
        setLoading(true);
        setError(null);
        
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
          router.push('/login');
          return;
        }
        
        // 현재 사용자 정보 저장
        setUser(session.user);
        
        // 커리어 정보 가져오기
        const { data: buildData, error: buildError } = await supabase
          .from('builds')
          .select('*')
          .eq('id', id)
          .single();
        
        if (buildError) {
          console.error('Builds 정보 조회 오류:', buildError);
          setError('커리어 정보를 찾을 수 없습니다.');
          return;
        }
        
        if (!buildData) {
          setError('커리어 정보를 찾을 수 없습니다.');
          return;
        }
        
        // 현재 사용자의 커리어가 아니면 접근 불가
        if (buildData.user_id !== session.user.id) {
          setError('이 커리어를 수정할 권한이 없습니다.');
          return;
        }
        
        setBuild(buildData);
      } catch (err) {
        console.error('조회 오류:', err);
        setError('커리어 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchBuild();
  }, [router, id]);
  
  const handleComplete = () => {
    router.push('/dashboard');
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-brand-base">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-brand-textSecondary text-sm">로딩 중...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-brand-base flex items-center justify-center px-4">
          <div className="bg-brand-surface border border-brand-border rounded-lg p-8 max-w-md w-full shadow-dark">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-error/10 mb-6 mx-auto">
              <svg className="w-6 h-6 text-brand-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-brand-text mb-2 text-center">오류 발생</h1>
            <p className="text-brand-textSecondary text-center mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-brand-primary text-brand-text rounded-md hover:bg-brand-primaryHover transition-all text-sm font-medium"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user || !build) {
    return null; // 로그인/커리어 체크 중
  }
  
  return (
    <Layout title="커리어 수정 - Builders">
      <Head>
        <meta name="description" content="커리어 정보를 수정하세요." />
      </Head>
      
      <div className="bg-brand-base min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => router.back()} 
              className="p-2 mr-3 rounded-md hover:bg-brand-surfaceHover transition-all"
            >
              <svg className="w-5 h-5 text-brand-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-brand-text">Build 수정</h1>
          </div>
          
          <div className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden shadow-dark">
            <SmartBuildForm
              userId={user.id}
              build={build}
              onComplete={handleComplete}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
} 