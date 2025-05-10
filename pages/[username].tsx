import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BuildList from '@/components/build/BuildList';
import { getClient } from '@/lib/supabase';
import { getUserProfileByUsername } from '@/utils/auth';
import { User } from '@/types/user';
import { cn } from '@/lib/utils';

export default function UserProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!username || typeof username !== 'string') return;
        
        setLoading(true);
        setError(null);
        
        // 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await getUserProfileByUsername(username);
        
        if (profileError) {
          console.error('프로필 정보 조회 오류:', profileError);
          setError('사용자를 찾을 수 없습니다.');
          return;
        }
        
        if (!profileData) {
          setError('사용자를 찾을 수 없습니다.');
          return;
        }
        
        setProfile(profileData);
        
        // 현재 로그인한 사용자 정보 가져오기
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setCurrentUser(session.user);
          setIsCurrentUser(session.user.id === profileData.id);
        }
      } catch (err) {
        console.error('프로필 조회 오류:', err);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [username]);
  
  const handleEditProfile = () => {
    router.push('/onboarding?edit=true');
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-brand-base">
          <div className="text-center animate-fade-in">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-brand-textSecondary text-sm">로딩 중...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !profile) {
    return (
      <Layout>
        <div className="min-h-screen bg-brand-base flex items-center justify-center px-4">
          <div className="bg-brand-surface border border-brand-border rounded-lg p-8 max-w-md w-full shadow-dark animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-border mb-6 mx-auto">
              <svg className="w-6 h-6 text-brand-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-brand-text mb-2 text-center">사용자를 찾을 수 없습니다</h1>
            <p className="text-brand-textSecondary text-center mb-6">해당 사용자가 존재하지 않거나 프로필이 설정되지 않았습니다.</p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-brand-primary text-brand-text rounded-md hover:bg-brand-primaryHover transition-all text-sm font-medium"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={`${profile.name || profile.username} - Builders`}>
      <Head>
        <meta 
          name="description" 
          content={profile.bio || `${profile.name || profile.username}의 포트폴리오입니다.`} 
        />
      </Head>
      
      <div className="bg-brand-base min-h-screen animate-fade-in">
        <ProfileHeader 
          user={profile} 
          isCurrentUser={isCurrentUser}
          onEditProfile={handleEditProfile}
        />
        
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="flex items-center mb-6 border-b border-brand-border pb-3">
            <h2 className="text-xl font-bold text-brand-text">커리어</h2>
            {isCurrentUser && (
              <Link
                href="/builds/new"
                className="ml-auto px-4 py-2 bg-brand-primary text-brand-text rounded-md hover:bg-brand-primaryHover transition-all text-sm font-medium"
              >
                새 커리어 추가
              </Link>
            )}
          </div>
          <BuildList username={profile.username} isOwner={isCurrentUser} />
        </div>
      </div>
    </Layout>
  );
} 