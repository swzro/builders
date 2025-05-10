import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { getClient } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkSession();
  }, []);
  
  return (
    <Layout>
      <Head>
        <title>Builders - 학생 포트폴리오 플랫폼</title>
        <meta 
          name="description" 
          content="나만의 커리어를 기록하고 포트폴리오로 관리하세요. 학생을 위한 온라인 포트폴리오 플랫폼, Builders." 
        />
      </Head>
      
      {/* 히어로 섹션 */}
      <section className="bg-brand-base border-b border-brand-border">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-brand-text leading-tight mb-6 animate-slide-up">
                나만의 커리어를<br />기록하고 관리하세요
              </h1>
              <p className="text-lg text-brand-textSecondary mb-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
                학생 시절의 모든 경험을 한 곳에서 관리하고<br />
                멋진 포트폴리오로 공유해보세요.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                {isLoggedIn ? (
                  <Link 
                    href="/dashboard" 
                    className="px-8 py-3 bg-brand-primary text-brand-text font-medium rounded-md hover:bg-brand-primaryHover transition-all text-center"
                  >
                    대시보드로 이동
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/signup" 
                      className="px-8 py-3 bg-brand-primary text-brand-text font-medium rounded-md hover:bg-brand-primaryHover transition-all text-center"
                    >
                      시작하기
                    </Link>
                    <Link 
                      href="/login" 
                      className="px-8 py-3 bg-brand-surface border border-brand-border text-brand-textSecondary font-medium rounded-md hover:bg-brand-surfaceHover hover:border-brand-borderHover transition-all text-center"
                    >
                      로그인
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            <div className="md:w-1/2 md:pl-10 animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="rounded-lg bg-brand-surface border border-brand-border p-2 shadow-dark overflow-hidden">
                {/* 이미지 - 그라데이션 효과 적용 */}
                <div className="relative w-full h-80 rounded-md bg-gradient-linear from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-mesh-pattern opacity-20"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-brand-surface to-transparent"></div>
                  <div className="relative z-10 text-center px-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="text-brand-text text-lg font-medium">포트폴리오 플랫폼</p>
                    <p className="text-brand-textSecondary mt-2">경험을 기록하고 공유하세요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* 기능 섹션 */}
      <section className="bg-brand-surface py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-brand-text mb-12 animate-fade-in">
            모든 경험을 한 곳에서 관리하세요
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-surface border border-brand-border p-6 rounded-lg hover:border-brand-borderHover transition-all animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">커리어 기록</h3>
              <p className="text-brand-textSecondary">
                대외활동, 인턴, 프로젝트, 수상 등 모든 경험을 카드 형태로 기록하고 관리하세요.
              </p>
            </div>
            
            <div className="bg-brand-surface border border-brand-border p-6 rounded-lg hover:border-brand-borderHover transition-all animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 bg-brand-secondary/10 rounded-full flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">공개 포트폴리오</h3>
              <p className="text-brand-textSecondary">
                나만의 URL로 포트폴리오를 공유하세요. 원하는 항목만 선택적으로 공개할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-brand-surface border border-brand-border p-6 rounded-lg hover:border-brand-borderHover transition-all animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">간편한 관리</h3>
              <p className="text-brand-textSecondary">
                직관적인 인터페이스로 커리어를 쉽게 추가, 수정, 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA 섹션 */}
      <section className="bg-gradient-linear from-brand-primary/10 to-brand-secondary/10 py-20 border-t border-brand-border">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-text mb-4 animate-fade-in">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-brand-textSecondary mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
              나만의 포트폴리오를 손쉽게 만들고 관리하세요.<br />
              무료로 시작할 수 있습니다.
            </p>
            
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="px-8 py-3 bg-brand-primary text-brand-text font-medium rounded-md hover:bg-brand-primaryHover transition-all inline-block shadow-glow"
                >
                  대시보드로 이동
                </Link>
              ) : (
                <Link 
                  href="/signup" 
                  className="px-8 py-3 bg-brand-primary text-brand-text font-medium rounded-md hover:bg-brand-primaryHover transition-all inline-block shadow-glow"
                >
                  무료로 시작하기
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
