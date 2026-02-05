
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion, StepData, WritingStep, ArticleLength, StreamCallback } from "../types.ts";
import { SYSTEM_PROMPT, STEPS_CONFIG, LENGTH_CONFIG } from "../constants.tsx";

/** FR-14: Exponential backoff 재시도 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message === 'API_KEY_INVALID') throw error;
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

function isApiKeyError(error: any): boolean {
  return error.message?.includes("Requested entity was not found") || error.message?.includes("API key");
}

export const generateWritingSuggestions = async (
  step: WritingStep,
  context: string,
  customRequests: string,
  previousSteps: string,
  targetLength: ArticleLength
): Promise<AISuggestion[]> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stepConfig = STEPS_CONFIG.find(c => c.name === step);
    const stepMission = stepConfig ? stepConfig.prompt : "기사를 작성하세요.";
    const lengthGuide = LENGTH_CONFIG[targetLength];

    const prompt = `
당신은 베테랑 편집장입니다. 기획 기사 작성의 [${step}] 단계를 수행 중입니다.

[전체 주제]
${context}

[목표 기사 분량]
${lengthGuide.label} (${lengthGuide.description})

[현재까지 확정된 기사 히스토리]
${previousSteps || "첫 단계 시작"}

[현재 단계 미션]
${stepMission}

[사용자 개별 요청]
${customRequests || "없음"}

[절대 지침]
1. 이전 단계에서 이미 확정된 문장이나 내용을 그대로 출력하지 마세요.
2. 현재 공정의 결과물은 반드시 이전 단계의 내용을 논리적으로 계승하면서 '새로운 정보'나 '심화된 구성'을 보여줘야 합니다.
3. 기사 분량 가이드를 준수하여 내용을 충분히 풍부하게 만드세요.
4. 문말 어미는 반드시 '~했다', '~이다'로 통일하세요.
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "title", "content", "explanation"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return data.suggestions || [];
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (isApiKeyError(error)) {
        throw new Error("API_KEY_INVALID");
      }
      throw error;
    }
  });
};

/** FR-11: Streaming 최종 기사 컴파일 */
export const compileFinalArticleStream = async (
  steps: StepData[],
  originalIdea: string,
  targetLength: ArticleLength,
  onChunk: StreamCallback
): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const lengthGuide = LENGTH_CONFIG[targetLength];

    const stepsContext = steps
      .map((s, i) => `[${STEPS_CONFIG[i]?.name || s.step}]\n${s.finalContent}`)
      .join('\n\n---\n\n');

    const prompt = `
당신은 베테랑 편집장입니다. 아래 6단계 편집 공정의 결과물을 종합하여 **하나의 완성된 기사 본문**을 출력하세요.

[원본 주제]
${originalIdea}

[목표 분량]
${lengthGuide.label} (${lengthGuide.description})

[편집 공정 결과물]
${stepsContext}

[최종 편집 지침]
1. Draft Smith와 Final Check 단계의 내용을 중심으로 완성도 높은 기사를 작성하라.
2. Topic, Angle, Reader, Structure 단계의 내용은 기사의 방향과 구조를 잡는 참고 자료로만 활용하라.
3. 기사 제목은 [A: B] 구조로 맨 첫 줄에 배치하라.
4. 문말 어미는 '~했다', '~이다' 체를 엄격히 준수하라.
5. 목표 분량 가이드를 준수하라.
6. 중복 문장, 반복 표현을 제거하고 논리적 흐름을 매끄럽게 다듬어라.
`;

    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
        }
      });

      let accumulated = '';
      for await (const chunk of response) {
        const text = chunk.text || '';
        accumulated += text;
        onChunk(text, accumulated);
      }
      return accumulated;
    } catch (error: any) {
      console.error("Gemini Streaming Error:", error);
      if (isApiKeyError(error)) {
        throw new Error("API_KEY_INVALID");
      }
      throw error;
    }
  });
};
