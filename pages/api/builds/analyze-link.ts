import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getOpenAIAnalysis } from '@/lib/openai';
import { BuildFormValues } from '@/types/build';

// 요청 스키마
const analyzeRequestSchema = z.object({
  urls: z.array(z.string().url())
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
    const validationResult = analyzeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: '유효한 URL 배열이 필요합니다',
      });
    }
    
    const { urls } = validationResult.data;
    
    if (urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: '최소 하나 이상의 URL이 필요합니다',
      });
    }

    // 각 URL에 대한 콘텐츠 가져오기
    const contentsPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`URL 접근 실패: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        
        // HTML 문서인 경우 텍스트로 처리
        if (contentType.includes('text/html')) {
          const text = await response.text();
          return { url, content: text, type: 'html' };
        }
        
        // JSON인 경우 JSON으로 처리
        if (contentType.includes('application/json')) {
          const json = await response.json();
          return { url, content: JSON.stringify(json, null, 2), type: 'json' };
        }
        
        // 기타 텍스트인 경우
        if (contentType.includes('text/')) {
          const text = await response.text();
          return { url, content: text, type: 'text' };
        }
        
        // 지원하지 않는 콘텐츠 타입
        return { 
          url, 
          content: `지원하지 않는 콘텐츠 타입: ${contentType}`, 
          type: 'unsupported' 
        };
      } catch (err: any) {
        console.error(`URL 처리 오류 (${url}):`, err);
        return { 
          url, 
          content: `URL 처리 오류: ${err.message}`, 
          type: 'error' 
        };
      }
    });
    
    // 모든 URL 콘텐츠 가져오기
    const urlContents = await Promise.all(contentsPromises);
    
    // 각 URL의 내용에 대한 요약 구성
    const combinedContent = urlContents.map(item => {
      return `URL: ${item.url}\n타입: ${item.type}\n내용:\n${
        // 콘텐츠가 너무 길면 자르기
        item.content.length > 3000 
          ? item.content.substring(0, 3000) + '... (내용이 너무 길어서 생략됨)'
          : item.content
      }\n\n`;
    }).join('---\n\n');
    
    // OpenAI를 사용하여 통합된 콘텐츠 분석
    const analysisPrompt = `
다음은 사용자가 제공한 ${urls.length}개의 URL에서 수집한 콘텐츠입니다:

${combinedContent}

제공된 URL 콘텐츠를 분석하여 프로젝트/활동에 관한 주요 정보를 추출해주세요.
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
    const aiResponse = await getOpenAIAnalysis(analysisPrompt);
    
    if (!aiResponse) {
      throw new Error('AI 분석 응답을 받지 못했습니다.');
    }
    
    try {
      // 분석 결과를 구조화된 객체로 변환
      const extractedInfo = {
        linkContent: aiResponse,  // 원본 분석 텍스트 저장
        source_urls: urls         // 소스 URL 보존
      };
      
      // 기본값 설정
      const buildData: BuildFormValues = {
        title: '링크 기반 분석',  // combine-analysis에서 최종 결정
        description: aiResponse,  // 분석 결과 원본을 설명에 임시 저장
        duration_start: new Date().toISOString().split('T')[0], // 오늘 날짜
        duration_end: '',
        category: '기타',
        tags: [],
        is_public: true,
        role: '',
        lesson: '',
        outcomes: '',
        source_urls: urls,
        ai_generated: true
      };
      
      return res.status(200).json({
        success: true,
        data: buildData
      });
    } catch (error) {
      console.error('링크 분석 처리 오류:', error);
      
      // 처리에 실패해도 사용자에게 기본 응답 반환
      const buildData: BuildFormValues = {
        title: urls.length === 1 ? `${new URL(urls[0]).hostname} 기반 Build` : 'URL 기반 Build',
        description: '이 빌드는 제공한 URL을 기반으로 생성되었습니다. 필요에 맞게 수정해주세요.',
        duration_start: new Date().toISOString().split('T')[0],
        duration_end: '',
        category: '기타',
        tags: [],
        is_public: true,
        source_urls: urls,
        ai_generated: true
      };
      
      return res.status(200).json({
        success: true,
        message: '링크 분석 처리에 실패했습니다. 기본 정보를 반환합니다.',
        data: buildData
      });
    }
  } catch (error: any) {
    console.error('링크 분석 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '서버 오류가 발생했습니다. 다시 시도해주세요.' 
    });
  }
} 