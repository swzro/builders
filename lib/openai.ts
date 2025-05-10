import { OpenAI } from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI를 사용하여 텍스트 분석
 * @param prompt 분석을 위한 프롬프트
 * @returns 분석 결과 텍스트
 */
export async function getOpenAIAnalysis(prompt: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 콘텐츠를 분석하여 구조화된 데이터로 만드는 AI 어시스턴트입니다. JSON 형식으로 응답해주세요."
        },
        {
          role: "user",
          content: prompt + "\n\n결과는 JSON 형식으로 제공해주세요."
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    return null;
  }
} 