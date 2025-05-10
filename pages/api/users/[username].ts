import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

type ResponseData = {
  success: boolean;
  message?: string;
  profile?: any;
  builds?: any[];
  error?: string;
};

/**
 * 사용자 프로필 및 공개 커리어를 조회하는 API 핸들러
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  }

  // 사용자명 추출
  const { username } = req.query;
  
  if (!username || Array.isArray(username)) {
    return res.status(400).json({
      success: false,
      error: '유효하지 않은 사용자명입니다.',
    });
  }

  try {
    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
      
    if (profileError) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.',
      });
    }
    
    // 사용자의 공개 커리어 항목 조회
    const { data: builds, error: buildsError } = await supabaseAdmin
      .from('builds')
      .select(`
        id,
        title,
        description,
        duration_start,
        duration_end,
        category,
        tags,
        image_url,
        is_public,
        created_at
      `)
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
      
    if (buildsError) {
      console.error('Builds 조회 오류:', buildsError);
      // 커리어 조회 오류가 있더라도 프로필은 반환
      return res.status(200).json({
        success: true,
        profile: sanitizeProfile(profile),
        builds: [],
      });
    }
    
    return res.status(200).json({
      success: true,
      profile: sanitizeProfile(profile),
      builds: builds || [],
    });
  } catch (error: any) {
    console.error('사용자 프로필 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
}

/**
 * 민감한 정보를 제거하고 안전한 프로필 정보만 반환
 */
function sanitizeProfile(profile: any) {
  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    school: profile.school,
    major: profile.major,
    bio: profile.bio,
    created_at: profile.created_at,
  };
} 