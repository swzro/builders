import { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  hideFooter?: boolean;
}

export default function Layout({
  children,
  title = 'Builders - 학생 포트폴리오 플랫폼',
  description = '학생들을 위한 온라인 포트폴리오 빌더 - 경험을 기록하고 공유하세요',
  hideFooter = false,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen bg-brand-base text-brand-text">
        <Header />
        <main className="flex-grow">{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </>
  );
} 