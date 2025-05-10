import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/supabase';

// Supabase URL과 익명 키를 환경 변수에서 불러옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 서버 사이드에서 사용할 Supabase 클라이언트
export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// API 라우트에서 사용할 Supabase 클라이언트
export const supabaseAdmin = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// 브라우저에서 싱글턴으로 Supabase 클라이언트 반환
let browserSupabase: ReturnType<typeof createBrowserClient<Database>> | undefined;
export const getClient = () => {
  if (typeof window === 'undefined') {
    // SSR 환경에서는 매번 새로 생성
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  if (!browserSupabase) {
    browserSupabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return browserSupabase;
}; 