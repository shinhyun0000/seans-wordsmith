
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion, WritingStep, ArticleLength } from "../types.ts";
import { SYSTEM_PROMPT, STEPS_CONFIG, LENGTH_CONFIG } from "../constants.tsx";

export const generateWritingSuggestions = async (
  step: WritingStep,
  context: string,
  customRequests: string,
  previousSteps: string,
  targetLength: ArticleLength
): Promise<AISuggestion[]> => {
  // 호출 시점에 process.env.API_KEY를 사용하도록 인스턴스 생성 (Paid Key 반영을 위함)
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
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API key")) {
        throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
