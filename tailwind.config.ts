import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // 메인 컬러 - Linear/토스 스타일
          base: '#000000',             // 메인 배경 - 더 진한 블랙
          surface: '#101010',          // 카드 배경 - 거의 검정
          surfaceHover: '#161616',     // 호버 시 배경
          border: '#1A1A1A',           // 테두리 - 미묘한 구분
          borderHover: '#333333',      // 호버 시 테두리
          divider: '#262626',          // 구분선
          
          // 텍스트 컬러
          text: '#FFFFFF',             // 주요 텍스트 - 밝은 화이트
          textSecondary: '#A1A1AA',    // 보조 텍스트
          textTertiary: '#636366',     // 세 번째 텍스트
          
          // 강조 컬러
          primary: '#6366F1',          // 주요 강조색 (인디고)
          primaryHover: '#4F46E5',     // 진한 버전
          primaryActive: '#4338CA',    // 더 진한 버전
          primaryFocus: 'rgba(99, 102, 241, 0.3)', // 포커스 링
          
          // 액센트 컬러
          secondary: '#9333EA',        // 보조 강조색 (퍼플)
          secondaryHover: '#7E22CE',   // 호버
          accent: '#06B6D4',           // 액센트 (시안)
          accentHover: '#0891B2',      // 호버
          
          // 상태 컬러
          success: '#10B981',          // 성공
          warning: '#F59E0B',          // 경고
          error: '#EF4444',            // 오류
          info: '#3B82F6',             // 정보
          
          // 특별 컬러
          highlight: 'rgba(99, 102, 241, 0.1)', // 강조 배경
          glass: 'rgba(10, 10, 10, 0.5)',      // 글래스 효과
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      fontSize: {
        'xs': '0.75rem',    // 12px
        'sm': '0.875rem',   // 14px
        'base': '1rem',     // 16px
        'lg': '1.125rem',   // 18px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',      // 4px
        DEFAULT: '0.375rem', // 6px
        md: '0.5rem',       // 8px
        lg: '0.75rem',      // 12px
        xl: '1rem',         // 16px
        '2xl': '1.5rem',    // 24px
        full: '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'dark': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.5)',
        'none': 'none',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-linear': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'mesh-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
export default config
