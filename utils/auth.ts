import { getClient } from '@/lib/supabase';

/**
 * 사용자 로그인
 */
export async function signIn(email: string, password: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

/**
 * 사용자 회원가입
 */
export async function signUp(email: string, password: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/onboarding`,
    },
  });
  
  return { data, error };
}

/**
 * 로그아웃
 */
export async function signOut() {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 사용자 프로필 데이터 가져오기
 */
export async function getUserProfile(userId: string) {
  console.log('getUserProfile 호출됨. userId:', userId);
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  console.log('getUserProfile 결과:', { data, error });
  return { data, error };
}

/**
 * 사용자명으로 프로필 데이터 가져오기
 */
export async function getUserProfileByUsername(username: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  return { data, error };
} 