import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import ProfileForm from '@/components/profile/ProfileForm';
import { getClient } from '@/lib/supabase';
import { getUserProfile } from '@/utils/auth';
import { User, EducationItem, LanguageItem, SkillCategory } from '@/types/user';

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [existingProfile, setExistingProfile] = useState<User | null>(null);
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
        
        // 현재 사용자 정보 저장
        setUser(session.user);
        
        // 기존 프로필 정보 확인
        const { data: profile, error: profileError } = await getUserProfile(session.user.id);
        
        if (profileError) {
          console.error('프로필 정보 조회 오류:', profileError);
          return;
        }
        
        if (profile) {
          // 프로필 정보가 이미 있고, 사용자명이 설정되어 있으면 대시보드로 리다이렉트
          if (profile.username) {
            setExistingProfile(profile);
            
            // 방문 목적이 프로필 수정이 아니라면 대시보드로 이동
            if (!router.query.edit) {
              router.push('/dashboard');
              return;
            }
          }
          
          setExistingProfile(profile);
        }
      } catch (err) {
        console.error('인증 체크 오류:', err);
        setError('인증 정보를 확인하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  const handleComplete = () => {
    console.log('onboarding 페이지의 handleComplete 함수 호출됨');
    router.push('/dashboard');
  };
  
  if (loading) {
    return (
      <Layout hideFooter>
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
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 bg-brand-primary text-brand-text rounded-md hover:bg-brand-primaryHover transition-all text-sm font-medium"
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return null; // 로그인 체크 중
  }
  
  return (
    <Layout title="프로필 설정 - Builders" hideFooter>
      <Head>
        <meta name="description" content="포트폴리오에 표시될 프로필 정보를 설정하세요." />
      </Head>
      
      <div className="bg-brand-base min-h-screen py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-brand-text mb-2">
              {existingProfile?.username ? '프로필 수정' : '프로필 설정'}
            </h1>
            <p className="text-brand-textSecondary max-w-sm">
              포트폴리오에 표시될 기본 정보를 입력해주세요.
            </p>
          </div>
          
          <div className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden shadow-dark">
            <ProfileForm
              userId={user.id}
              defaultValues={existingProfile ? {
                username: existingProfile.username,
                name: existingProfile.name || '',
                bio: existingProfile.bio || '',
                education: (existingProfile.education || []) as EducationItem[],
                language: (existingProfile.language || []) as LanguageItem[],
                etc: existingProfile.etc || '',
                skills: (existingProfile.skills || []) as SkillCategory[],
              } : undefined}
              onComplete={handleComplete}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
} 