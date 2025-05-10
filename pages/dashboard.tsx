import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { getUserProfile } from '@/utils/auth';
import { User, EducationItem, LanguageItem, SkillCategory } from '@/types/user';
import { getClient } from '@/lib/supabase';
import BuildList from '@/components/build/BuildList';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
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
        
        // 사용자 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await getUserProfile(session.user.id);
        
        if (profileError) {
          console.error('프로필 정보 조회 오류:', profileError);
          return;
        }
        
        if (profileData) {
          setProfile(profileData);
          
          // 프로필 설정이 완료되지 않았으면 onboarding 페이지로 리다이렉트
          if (!profileData.username) {
            router.push('/onboarding');
            return;
          }
        } else {
          // 프로필 정보가 없으면 onboarding 페이지로 리다이렉트
          router.push('/onboarding');
          return;
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
  
  if (!user || !profile) {
    return null; // 로그인/프로필 체크 중
  }
  
  return (
    <Layout title="대시보드 - Builders">
      <Head>
        <meta name="description" content="나의 커리어와 포트폴리오를 관리하세요." />
      </Head>
      
      <div className="bg-brand-base min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 헤더 섹션 */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-6 border-b border-brand-border">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-brand-text">대시보드</h1>
              <p className="text-brand-textSecondary mt-1 text-sm">나의 커리어와 포트폴리오를 관리하세요.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href={`/${profile.username}`}
                className="px-4 py-2 bg-brand-surface border border-brand-border rounded-md text-brand-text text-sm hover:bg-brand-surfaceHover hover:border-brand-borderHover transition-all flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                내 포트폴리오 보기
              </Link>
              
              <Link
                href={`/onboarding?edit=true`}
                className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-md text-brand-primary text-sm hover:bg-brand-primary/20 transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                프로필 수정
              </Link>
            </div>
          </div>
          
          {/* 프로필 정보와 커리어를 위-아래로 배치 */}
          <div className="flex flex-col space-y-8">
            {/* 프로필 정보 카드 - 대형 스타일 */}
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-dark p-8 mb-10">
              {/* 상단 인사/이름/요약/소개 */}
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mr-0 md:mr-8 mb-6 md:mb-0">
                  <span className="text-4xl font-bold text-brand-primary">{profile.name ? profile.name.charAt(0).toUpperCase() : '?'}</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  {profile.bio && (
                    <h2 className="text-lg text-brand-text mb-2 whitespace-pre-line">{profile.bio}</h2>
                  )}
                  {profile.etc && (
                    <p className="text-base text-brand-textSecondary whitespace-pre-line">{profile.etc}</p>
                  )}
                </div>
              </div>
              {/* Profile 섹션 */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 좌: 경력 */}
                  <div>
                    <h4 className="text-lg font-semibold text-brand-text mb-2">경력{profile.education && profile.education.length > 0 && ` (총 ${profile.education.length}건)`}</h4>
                    {profile.education && profile.education.length > 0 ? (
                      <div className="space-y-4">
                        {(profile.education as EducationItem[]).map((edu: EducationItem, index: number) => (
                          <div key={index} className="text-base text-brand-text">
                            <p className="font-medium">{edu.institution}</p>
                            <p className="text-sm text-brand-textSecondary">
                              {edu.degree} {edu.field && `· ${edu.field}`}
                            </p>
                            <p className="text-sm text-brand-textTertiary">
                              {edu.start_date} - {edu.is_current ? '현재' : edu.end_date}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-brand-textSecondary">경력 정보가 없습니다.</p>
                    )}
                  </div>
                  {/* 우: 학력/외국어/기타 */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-brand-text mb-2">학력</h4>
                      {profile.education && profile.education.length > 0 ? (
                        <div className="space-y-2">
                          {(profile.education as EducationItem[]).map((edu: EducationItem, index: number) => (
                            <div key={index} className="text-base text-brand-text">
                              <p className="font-medium">{edu.institution}</p>
                              <p className="text-sm text-brand-textSecondary">
                                {edu.degree} {edu.field && `· ${edu.field}`}
                              </p>
                              <p className="text-sm text-brand-textTertiary">
                                {edu.start_date} - {edu.is_current ? '현재' : edu.end_date}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-brand-textSecondary">학력 정보가 없습니다.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-brand-text mb-2">외국어</h4>
                      {profile.language && profile.language.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(profile.language as LanguageItem[]).map((lang: LanguageItem, index: number) => (
                            <div key={index} className="text-base px-2 py-1 bg-brand-surface border border-brand-border rounded-md">
                              {lang.name} · {getLevelText(lang.level)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-brand-textSecondary">외국어 정보가 없습니다.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-brand-text mb-2">기타</h4>
                      {profile.etc ? (
                        <p className="text-base text-brand-text whitespace-pre-line">{profile.etc}</p>
                      ) : (
                        <p className="text-brand-textSecondary">기타 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Builds 카드(리스트) */}
            <div className="bg-brand-surface rounded-lg border border-brand-border overflow-hidden shadow-dark h-full">
              <div className="p-5 border-b border-brand-border flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-wider text-brand-textSecondary font-medium">나의 Builds</h2>
                <Link 
                  href="/builds/new" 
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-brand-text bg-brand-primary hover:bg-brand-primaryHover transition-all"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  새 Builds
                </Link>
              </div>
              <div className="p-5">
                <BuildList userId={user.id} isOwner={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// 언어 레벨 표시 함수
function getLevelText(level: string): string {
  switch (level) {
    case 'beginner':
      return '초급';
    case 'intermediate':
      return '중급';
    case 'advanced':
      return '고급';
    case 'native':
      return '원어민';
    default:
      return level;
  }
} 