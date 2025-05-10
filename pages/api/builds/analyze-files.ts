import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { OpenAI } from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    source_url: null,
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
    다음 텍스트 파일들을 분석하여 아래 포맷으로 프로젝트/활동 정보를 생성해주세요:
    
    파일 정보:
    ${combinedContent}
    
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
    
    파일 내용에서 최대한 많은 정보를 추출하여 적절한 값을 생성해주세요.
    JSON 형식으로만 응답해주세요.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "너는 텍스트 파일을 분석하여 프로젝트/활동 정보를 추출하는 전문가야. JSON 형식으로 응답해."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const responseText = response.choices[0].message.content?.trim() || '';
    
    // JSON 추출 (중괄호로 시작하고 끝나는 부분 추출)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('유효한 JSON 형식의 응답을 받지 못했습니다.');
    }
    
    const jsonStr = jsonMatch[0];
    const buildInfo = JSON.parse(jsonStr);
    
    // AI가 생성했음을 표시
    buildInfo.ai_generated = true;
    
    // 빈 문자열인 경우 null로 변환
    if (buildInfo.duration_end === '') buildInfo.duration_end = null;
    
    return buildInfo;
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error;
  }
} 