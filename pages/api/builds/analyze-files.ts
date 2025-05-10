import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getOpenAIAnalysis } from '@/lib/openai';
import { BuildFormValues } from '@/types/build';

// 파일 분석 요청 스키마
const fileAnalysisSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    content: z.string(),
    type: z.string()
  })).min(1).max(3)
});

type ResponseData = {
  success: boolean;
  message?: string;
  data?: BuildFormValues;
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
    const validationResult = fileAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
      });
    }

    const { files } = validationResult.data;
    
    try {
      // OpenAI API를 사용하여 파일 분석 및 Build 정보 생성
      const buildInfo = await generateBuildInfoFromFiles(files);
      
      return res.status(200).json({
        success: true,
        data: buildInfo
      });
    } catch (aiError: any) {
      console.error('OpenAI API 호출 오류:', aiError);
      
      // OpenAI API 호출 실패 시 기본 데이터 생성
      const fallbackBuildInfo = generateFallbackBuildInfo(files);
      
      return res.status(200).json({
        success: true,
        data: fallbackBuildInfo,
        message: 'AI 분석 오류로 기본 정보가 생성되었습니다. 내용을 직접 수정해주세요.'
      });
    }
    
  } catch (error: any) {
    console.error('파일 분석 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
}

/**
 * OpenAI API 호출 실패 시 기본 데이터 생성
 */
function generateFallbackBuildInfo(files: any[]): any {
  // 현재 날짜
  const currentDate = new Date();
  
  // 3개월 전 날짜 계산
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // ISO 형식의 날짜 문자열로 변환 (YYYY-MM-DD)
  const startDate = threeMonthsAgo.toISOString().split('T')[0];
  
  // 파일 이름에서 기본 제목 추출 시도
  let title = '';
  try {
    // 첫 번째 파일의 이름에서 확장자 제거
    const fileName = files[0].name;
    title = fileName.split('.').slice(0, -1).join('.')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase()); // 각 단어 첫 글자를 대문자로
  } catch (e) {
    // 파싱 오류 시 기본 제목
    title = '텍스트 파일 기반 프로젝트';
  }
  
  // 제목이 비어있으면 기본값 설정
  if (!title) {
    title = '텍스트 파일 기반 프로젝트';
  }
  
  // 기본 태그 생성
  const tags = ['문서', '텍스트', '기록', '프로젝트'];
  
  // 기본 카테고리 설정
  const category = '프로젝트';
  
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
    source_urls: [],
    ai_generated: true
  };
}

/**
 * OpenAI API를 사용하여 Build 정보 생성
 */
async function generateBuildInfoFromFiles(files: any[]): Promise<any> {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 파일 내용 결합 (최대 길이 제한)
    let combinedContent = '';
    for (const file of files) {
      const truncatedContent = file.content.substring(0, 3000); // 각 파일은 최대 3000자까지만
      combinedContent += `파일명: ${file.name}\n타입: ${file.type}\n내용:\n${truncatedContent}\n\n`;
    }
    
    // 너무 긴 경우 잘라내기
    if (combinedContent.length > 8000) {
      combinedContent = combinedContent.substring(0, 8000) + "...(내용 일부 생략)";
    }
    
    const prompt = `
다음 텍스트 파일들을 분석하여 프로젝트/활동에 관한 주요 정보를 추출해주세요:

파일 정보:
${combinedContent}

제공된 파일 콘텐츠를 분석하여 프로젝트/활동에 관한 주요 정보를 추출해주세요.
다음 측면에 초점을 맞추어 자세한 설명을 제공해주세요:

1. 활동/프로젝트 개요: 무엇에 관한 것인지, 주요 목적이나 의의는 무엇인지
2. 주요 기술이나 도구: 사용된 기술, 방법론, 도구 등
3. 역할과 책임: 이 프로젝트에서 맡은 역할이나 기여도
4. 주요 성과나 결과: 프로젝트의 결과물, 성취, 영향력
5. 기간: 시작일과 종료일 (추측 가능하면 제안)
6. 관련 키워드: 이 활동/프로젝트를 가장 잘 설명하는 키워드 (5개 이내)

각 섹션을 구분하여 자세히 설명해주시고, 직접적인 증거가 없는 내용은 "정보가 부족합니다"라고 명시해주세요.
가능한 많은 세부 정보를 포함하되, 신뢰할 수 있는 정보만 제공해주세요.
`;
    
    // OpenAI API 호출
    const aiResponse = await getOpenAIAnalysis(prompt);
    
    if (!aiResponse) {
      throw new Error('AI 분석 응답을 받지 못했습니다.');
    }
    
    // 분석 결과를 기본 BuildFormValues 형식으로 반환
    return {
      title: '파일 기반 분석',  // combine-analysis에서 최종 결정
      description: aiResponse,  // 분석 결과 원본을 설명에 임시 저장
      duration_start: new Date().toISOString().split('T')[0], // 오늘 날짜
      duration_end: '',
      category: '기타',
      tags: [],
      is_public: true,
      role: '',
      lesson: '',
      outcomes: '',
      source_urls: [],
      ai_generated: true
    };
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error; // 오류를 상위로 전파하여 fallback 로직에서 처리
  }
} 