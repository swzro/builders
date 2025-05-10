import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getOpenAIAnalysis } from '@/lib/openai';
import { BuildFormValues } from '@/types/build';

// 분석 결과 통합 요청 스키마
const combineAnalysisSchema = z.object({
  linkAnalysis: z.any().optional(),
  fileAnalysis: z.any().optional()
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
    // 요청 데이터 검증
    const validationResult = combineAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: '유효한 분석 결과 데이터가 필요합니다',
      });
    }
    
    const { linkAnalysis, fileAnalysis } = validationResult.data;

    // 링크 또는 파일 분석 데이터가 없는 경우 처리
    if (!linkAnalysis && !fileAnalysis) {
      return res.status(400).json({
        success: false,
        error: '최소한 하나의 분석 데이터가 필요합니다',
      });
    }

    // 링크 분석 또는 파일 분석 데이터만 있는 경우 바로 반환
    if (!linkAnalysis) {
      return res.status(200).json({
        success: true,
        data: fileAnalysis
      });
    }

    if (!fileAnalysis) {
      return res.status(200).json({
        success: true,
        data: linkAnalysis
      });
    }
    
    // 두 분석 결과를 통합하기 위한 프롬프트 작성
    const combinedAnalysisPrompt = `
당신은 프로젝트와 활동 정보를 구조화하는 전문가입니다. 다음은 동일한 프로젝트/활동에 대한 두 가지 분석 결과입니다:

## 링크 분석 결과:
${linkAnalysis.description || '정보 없음'}

## 파일 분석 결과:
${fileAnalysis.description || '정보 없음'}

위의 두 분석 결과를 바탕으로 하나의 완전하고 일관된 프로젝트/활동 정보를 생성해주세요.
각 정보는 다음 형식에 맞게 정리하여 최종 JSON 형식으로 제공해주세요:

1. title: 프로젝트/활동의 제목 (간결하면서도 구체적으로)
2. description: 프로젝트/활동에 대한 종합적인 설명 (두 분석 내용을 통합하여 500자 이내로)
3. category: 가장 적절한 카테고리 선택 (프로젝트, 대외활동, 인턴, 수상, 동아리, 자격증, 교육, 기타 중 하나)
4. duration_start: 시작 날짜 (YYYY-MM-DD 형식, 명확한 날짜가 없으면 적절히 추정)
5. duration_end: 종료 날짜 (YYYY-MM-DD 형식, 진행 중이면 빈 문자열)
6. tags: 관련 키워드 (최대 5개, 배열 형식)
7. role: 프로젝트에서의 역할 (두 분석 내용을 통합하여 구체적으로)
8. lesson: 이 활동을 통해 배운 점 (두 분석 내용에서 추출하여 구체적으로)
9. outcomes: 이 활동의 성과 (두 분석 내용에서 추출하여 구체적으로)

두 분석 결과 중 더 신뢰할 수 있거나 구체적인 정보를 우선적으로 사용하되, 상호 보완적인 내용은 적절히 통합해주세요.
정보가 불확실한 부분은 "정보 부족"으로 표시하지 말고, 있는 정보만 최대한 활용하여 완성된 형태로 제공해주세요.

JSON 형식으로 응답해주세요.
`;

    // OpenAI API 호출
    const aiResponse = await getOpenAIAnalysis(combinedAnalysisPrompt);
    
    if (!aiResponse) {
      throw new Error('AI 분석 응답을 받지 못했습니다.');
    }
    
    try {
      // AI 응답을 JSON으로 파싱
      const combinedData = JSON.parse(aiResponse);
      
      // 현재 날짜 (기본값용)
      const currentDate = new Date().toISOString().split('T')[0];
      
      // 필수 필드가 없는 경우 기본값 설정
      const buildData: BuildFormValues = {
        title: combinedData.title || '통합 Build',
        description: combinedData.description || '',
        duration_start: combinedData.duration_start || currentDate,
        duration_end: combinedData.duration_end || '',
        category: combinedData.category || '기타',
        tags: Array.isArray(combinedData.tags) ? combinedData.tags : [],
        image_url: combinedData.image_url || '',
        is_public: combinedData.is_public !== undefined ? combinedData.is_public : true,
        source_urls: Array.isArray(combinedData.source_urls) ? combinedData.source_urls : 
          (linkAnalysis.source_urls || []),
        role: combinedData.role || '',
        lesson: combinedData.lesson || '',
        outcomes: combinedData.outcomes || '',
        ai_generated: true
      };
      
      return res.status(200).json({
        success: true,
        data: buildData
      });
    } catch (error) {
      console.error('AI 응답 파싱 오류:', error);
      console.log('원본 AI 응답:', aiResponse);
      
      // 파싱에 실패한 경우 기본 통합 로직으로 결과 생성
      const fallbackData = generateFallbackCombinedData(linkAnalysis, fileAnalysis);
      
      return res.status(200).json({
        success: true,
        message: 'AI 응답 파싱에 실패했습니다. 기본 통합 정보를 반환합니다.',
        data: fallbackData
      });
    }
  } catch (error: any) {
    console.error('분석 결과 통합 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
}

/**
 * 기본 통합 로직으로 결과 생성
 */
function generateFallbackCombinedData(linkAnalysis: any, fileAnalysis: any): BuildFormValues {
  // 현재 날짜
  const currentDate = new Date().toISOString().split('T')[0];
  
  // 태그 통합 (중복 제거, 최대 5개)
  const linkTags = Array.isArray(linkAnalysis.tags) ? linkAnalysis.tags : [];
  const fileTags = Array.isArray(fileAnalysis.tags) ? fileAnalysis.tags : [];
  const combinedTags = Array.from(new Set([...linkTags, ...fileTags])).slice(0, 5);
  
  // 날짜 통합 (더 빠른 시작일, 더 늦은 종료일)
  let startDate = '';
  if (linkAnalysis.duration_start && fileAnalysis.duration_start) {
    startDate = new Date(linkAnalysis.duration_start) < new Date(fileAnalysis.duration_start) 
      ? linkAnalysis.duration_start : fileAnalysis.duration_start;
  } else {
    startDate = linkAnalysis.duration_start || fileAnalysis.duration_start || currentDate;
  }
  
  let endDate = '';
  if (linkAnalysis.duration_end && fileAnalysis.duration_end) {
    endDate = new Date(linkAnalysis.duration_end) > new Date(fileAnalysis.duration_end) 
      ? linkAnalysis.duration_end : fileAnalysis.duration_end;
  } else {
    endDate = linkAnalysis.duration_end || fileAnalysis.duration_end || '';
  }
  
  // 텍스트 필드 통합 (두 내용이 있으면 결합)
  const combineText = (text1?: string, text2?: string): string => {
    if (text1 && text2) {
      if (text1 === text2) return text1;
      return `${text1}\n\n${text2}`;
    }
    return text1 || text2 || '';
  };
  
  return {
    title: linkAnalysis.title || fileAnalysis.title || '통합 Build',
    description: combineText(linkAnalysis.description, fileAnalysis.description),
    duration_start: startDate,
    duration_end: endDate,
    category: linkAnalysis.category || fileAnalysis.category || '기타',
    tags: combinedTags,
    image_url: linkAnalysis.image_url || fileAnalysis.image_url || '',
    is_public: true,
    source_urls: linkAnalysis.source_urls || [],
    role: combineText(linkAnalysis.role, fileAnalysis.role),
    lesson: combineText(linkAnalysis.lesson, fileAnalysis.lesson),
    outcomes: combineText(linkAnalysis.outcomes, fileAnalysis.outcomes),
    ai_generated: true
  };
} 