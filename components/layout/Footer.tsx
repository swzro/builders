import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-surface border-t border-brand-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <img src="/logo-full.png" alt="bldrs 로고" style={{ height: 32, width: 'auto', display: 'block' }} />
            </Link>
            <p className="text-sm text-brand-subtext mt-2">
              학생들을 위한 포트폴리오 빌더
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 items-center">
            <Link
              href="/"
              className="text-sm text-brand-subtext hover:text-brand-text"
            >
              홈
            </Link>
            <Link
              href="/about"
              className="text-sm text-brand-subtext hover:text-brand-text"
            >
              소개
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-brand-subtext hover:text-brand-text"
            >
              개인정보 처리방침
            </Link>
            <Link
              href="/terms"
              className="text-sm text-brand-subtext hover:text-brand-text"
            >
              이용약관
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-brand-border text-center">
          <p className="text-sm text-brand-hint">
            &copy; {currentYear} Builders. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 