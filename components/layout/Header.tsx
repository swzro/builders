import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { getClient } from '@/lib/supabase';
import { getCurrentUser } from '@/utils/auth';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        // Supabase 클라이언트를 통해 현재 사용자 세션 확인
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('세션이 없습니다.');
          setLoading(false);
          return;
        }
        
        // 현재 사용자 정보 가져오기
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          console.log('사용자 정보를 가져올 수 없습니다.');
          setLoading(false);
          return;
        }
        
        // 토큰 관리
        const token = session.access_token;
        if (token) {
          localStorage.setItem('access_token', token);
        } else {
          console.log('토큰이 없습니다.');
          setLoading(false);
          return;
        }
        
        try {
          // 사용자 프로필 정보 가져오기 (Supabase RPC 직접 호출)
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (profileError) {
            console.error('프로필 정보 조회 오류:', profileError);
          } else if (profileData) {
            setUser({ ...currentUser, ...profileData });
          } else {
            setUser(currentUser);
          }
        } catch (profileErr) {
          console.error('프로필 조회 중 오류:', profileErr);
          setUser(currentUser); // 기본 사용자 정보라도 설정
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      // Supabase 로그아웃
      const supabase = getClient();
      await supabase.auth.signOut();
      
      // 로컬 스토리지 정리
      localStorage.removeItem('access_token');
      setUser(null);
      
      // 리다이렉트
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="bg-brand-surface border-b border-brand-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-brand-text">
            Builders
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link 
                href="/dashboard" 
                className={cn(
                  "text-sm font-medium transition-colors",
                  router.pathname === '/dashboard'
                    ? "text-brand-primary"
                    : "text-brand-subtext hover:text-brand-text"
                )}
              >
                대시보드
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center text-sm font-medium text-brand-subtext hover:text-brand-text"
                >
                  내 계정
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(
                      "ml-1 h-4 w-4 transition-transform",
                      menuOpen && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-brand-surface rounded-md shadow-lg py-1 z-10 border border-brand-border">
                    <Link
                      href={`/${user.username || ''}`}
                      className="block px-4 py-2 text-sm text-brand-subtext hover:bg-brand-border hover:text-brand-text"
                      onClick={() => setMenuOpen(false)}
                    >
                      내 프로필
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-brand-subtext hover:bg-brand-border hover:text-brand-text"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm font-medium transition-colors",
                  router.pathname === '/login'
                    ? "text-brand-primary"
                    : "text-brand-subtext hover:text-brand-text"
                )}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primaryHover"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-brand-subtext"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* 모바일 메뉴 */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-brand-surface z-10 border-b border-brand-border">
            <div className="container mx-auto py-4 px-4 space-y-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-sm font-medium text-brand-subtext hover:text-brand-text"
                    onClick={() => setMenuOpen(false)}
                  >
                    대시보드
                  </Link>
                  <Link
                    href={`/${user.username || ''}`}
                    className="block text-sm font-medium text-brand-subtext hover:text-brand-text"
                    onClick={() => setMenuOpen(false)}
                  >
                    내 프로필
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left text-sm font-medium text-brand-subtext hover:text-brand-text"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-sm font-medium text-brand-subtext hover:text-brand-text"
                    onClick={() => setMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-sm font-medium text-brand-subtext hover:text-brand-text"
                    onClick={() => setMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 