import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { OpenAI } from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 링크 분석 요청 스키마
const linkAnalysisSchema = z.object({
  url: z.string().url('유효한 URL을 입력해주세요')
});

type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  }

  try {
    // 현재 로그인한 사용자 확인 (쿠키 또는 헤더 기반)
    let user;
    let authError;
    
    // 1. 쿠키 기반 인증 시도
    const { data: cookieAuthData, error: cookieAuthError } = await supabaseAdmin.auth.getUser();
    
    if (cookieAuthData?.user) {
      user = cookieAuthData.user;
    } else {
      // 2. 헤더 기반 인증 시도
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: tokenAuthData, error: tokenAuthError } = await supabaseAdmin.auth.getUser(token);
        
        if (tokenAuthData?.user) {
          user = tokenAuthData.user;
        } else {
          authError = tokenAuthError;
        }
      } else {
        authError = cookieAuthError;
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '인증되지 않은 사용자입니다.',
      });
    }

    // 요청 데이터 검증
    const validationResult = linkAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
      });
    }

    const { url } = validationResult.data;
    
    // 링크 타입 감지 (GitHub, Figma, Notion 등)
    const linkType = detectLinkType(url);
    
    // 링크에서 정보 추출
    const extractedInfo = await extractInfoFromLink(url, linkType);
    
    try {
      // OpenAI API를 사용하여 Build 정보 생성
      const buildInfo = await generateBuildInfo(url, extractedInfo, linkType);
      
      return res.status(200).json({
        success: true,
        data: buildInfo
      });
    } catch (aiError: any) {
      console.error('OpenAI API 호출 오류:', aiError);
      
      // OpenAI API 호출 실패 시 기본 데이터 생성
      const fallbackBuildInfo = generateFallbackBuildInfo(url, linkType, extractedInfo);
      
      return res.status(200).json({
        success: true,
        data: fallbackBuildInfo,
        message: 'AI 분석 오류로 기본 정보가 생성되었습니다. 내용을 직접 수정해주세요.'
      });
    }
    
  } catch (error: any) {
    console.error('링크 분석 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
}

/**
 * 링크 타입 감지 (GitHub, Figma, Notion 등)
 */
function detectLinkType(url: string): string {
  if (url.includes('github.com')) {
    return 'github';
  } else if (url.includes('figma.com')) {
    return 'figma';
  } else if (url.includes('notion.so')) {
    return 'notion';
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else {
    return 'other';
  }
}

/**
 * 링크에서 정보 추출
 */
async function extractInfoFromLink(url: string, linkType: string): Promise<any> {
  // 여기서는 간단히 URL을 반환하지만, 실제로는 각 플랫폼별 API를 호출하여 정보를 추출
  // GitHub API, Figma API, Notion API 등 사용
  return {
    url,
    type: linkType,
    // 추가 정보는 각 플랫폼별 API 호출 결과
  };
}

/**
 * OpenAI API 호출 실패 시 기본 데이터 생성
 */
function generateFallbackBuildInfo(url: string, linkType: string, extractedInfo: any): any {
  // 현재 날짜
  const currentDate = new Date();
  
  // 3개월 전 날짜 계산
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // ISO 형식의 날짜 문자열로 변환 (YYYY-MM-DD)
  const startDate = threeMonthsAgo.toISOString().split('T')[0];
  
  // 링크에서 기본 제목 추출 시도
  let title = '';
  try {
    // URL 경로에서 마지막 부분을 추출하여 대시/언더스코어를 공백으로 변환
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      title = lastPart
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()); // 각 단어 첫 글자를 대문자로
    }
  } catch (e) {
    // URL 파싱 오류 시 기본 제목
    title = linkType === 'github' ? 'GitHub 프로젝트' : 
           linkType === 'figma' ? 'Figma 디자인' :
           linkType === 'notion' ? 'Notion 문서' :
           linkType === 'youtube' ? 'YouTube 영상' : '웹 프로젝트';
  }
  
  // 제목이 비어있으면 기본값 설정
  if (!title) {
    title = linkType === 'github' ? 'GitHub 프로젝트' : 
           linkType === 'figma' ? 'Figma 디자인' :
           linkType === 'notion' ? 'Notion 문서' :
           linkType === 'youtube' ? 'YouTube 영상' : '웹 프로젝트';
  }
  
  // 링크 타입에 따른 태그 생성
  let tags: string[] = [];
  switch (linkType) {
    case 'github':
      tags = ['개발', 'GitHub', '코딩', '프로그래밍'];
      break;
    case 'figma':
      tags = ['디자인', 'Figma', 'UI/UX', '그래픽'];
      break;
    case 'notion':
      tags = ['문서', 'Notion', '기록', '협업'];
      break;
    case 'youtube':
      tags = ['영상', 'YouTube', '미디어', '콘텐츠'];
      break;
    default:
      tags = ['웹', '프로젝트'];
  }
  
  // 기본 카테고리 설정
  const category = linkType === 'github' ? '프로젝트' : 
                  linkType === 'figma' ? '프로젝트' :
                  linkType === 'notion' ? '기타' :
                  linkType === 'youtube' ? '교육' : '프로젝트';
  
  return {
    title: title,
    description: `이 ${category}에 대한 상세 설명을 입력해주세요. 어떤 내용인지, 왜 중요한지, 어떤 목적으로 진행되었는지 등의 내용을 포함하면 좋습니다.`,
    role: `이 ${category}에서 내가 수행한 역할을 입력해주세요.`,
    duration_start: startDate,
    duration_end: null,
    lesson: `이 ${category}를 통해 배운 점을 입력해주세요. 새롭게 알게 된 기술, 개념, 또는 경험 등을 기록하면 좋습니다.`,
    outcomes: `이 ${category}의 성과를 입력해주세요. 완성된 결과물, 달성한 목표, 또는 긍정적인 피드백 등을 기록하면 좋습니다.`,
    category: category,
    tags: tags,
    source_url: url,
    ai_generated: true
  };
}

/**
 * OpenAI API를 사용하여 Build 정보 생성
 */
async function generateBuildInfo(url: string, extractedInfo: any, linkType: string): Promise<any> {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `
    링크를 분석하여 아래 포맷으로 프로젝트/활동 정보를 생성해주세요:
    
    링크: ${url}
    링크 타입: ${linkType}
    추출된 정보: ${JSON.stringify(extractedInfo)}
    
    다음 정보를 JSON 형식으로 제공해주세요:
    1. title: 프로젝트/활동 제목 (간결하고 명확하게)
    2. description: 프로젝트/활동에 대한 간략한 설명 (3-5문장)
    3. role: 해당 프로젝트에서의 역할 (1-2문장)
    4. duration_start: 시작 날짜 (YYYY-MM-DD 형식, 추측 가능하면 ${currentDate}에서 3개월 전)
    5. duration_end: 종료 날짜 (진행 중이면 null)
    6. lesson: 이 활동을 통해 배운 점 (2-3문장)
    7. outcomes: 이 활동의 성과 (2-3문장)
    8. category: 카테고리 (대외활동, 인턴, 수상, 프로젝트, 동아리, 자격증, 교육, 기타 중 하나)
    9. tags: 관련 태그 (최대 5개, 배열 형식)
    
    JSON 형식으로만 응답해주세요.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 링크에서 프로젝트나 활동 정보를 추출하여 구조화된 데이터로 만드는 AI 어시스턴트입니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // AI 생성 정보 + 원본 링크
    return {
      ...result,
      source_url: url,
      ai_generated: true
    };
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error; // 오류를 상위로 전파하여 fallback 로직에서 처리
  }
} 