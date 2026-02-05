# Sean's WordSmith v1.1 - Design Document

## 1. Architecture Overview

### 1.1 Application Type
- Single Page Application (React SPA) - v1.0과 동일
- Client-side only (no backend server)
- External API: Google Gemini API with Streaming + Google Search Grounding

### 1.2 Component Architecture (v1.1 변경사항)

```
App (Root) - 변경 없음
├── LandingPage              # 변경 없음
├── WritingEditor             # [Major 변경]
│   ├── StepNavigation       # 변경 없음 (인라인)
│   ├── InstructionPanel     # 제안서 재생성 버튼 추가 (FR-17)
│   ├── SuggestionList       # 스켈레톤 로딩 추가 (FR-18)
│   ├── ContentEditor        # 글자수 카운터 추가 (FR-13), Streaming 표시 (FR-11)
│   ├── EditorialPreview     # Markdown 렌더링 (FR-12), 모바일 토글 (FR-15)
│   ├── CharCountBar         # [NEW] 글자수 진행률 바 (FR-13)
│   ├── SaveIndicator        # [NEW] 자동저장 상태 (FR-16)
│   └── MobilePreviewToggle  # [NEW] 모바일 프리뷰 토글 버튼 (FR-15)
├── FinalArticleView          # [Medium 변경] Markdown 렌더링 (FR-12), Streaming (FR-11)
└── MarkdownRenderer          # [NEW] 공통 Markdown 렌더링 컴포넌트 (FR-12)
```

### 1.3 Directory Structure (v1.1 변경분만)

```
seans_wordsmith_v1.0/
├── components/
│   ├── WritingEditor.tsx        # [수정] Streaming, 글자수, 모바일 프리뷰, 스켈레톤
│   ├── FinalArticleView.tsx     # [수정] Markdown 렌더링, Streaming 표시
│   ├── MarkdownRenderer.tsx     # [신규] 공통 Markdown 렌더링
│   ├── LandingPage.tsx          # 변경 없음
│   └── Logo.tsx                 # 변경 없음
├── services/
│   └── geminiService.ts         # [수정] Streaming API + 재시도 로직
├── types.ts                     # [수정] Streaming/CharCount 타입 추가
├── constants.tsx                # [수정] LENGTH_TARGET_CHARS 추가
├── index.html                   # [수정] react-markdown importmap 추가
├── App.tsx                      # 변경 없음
└── index.tsx                    # 변경 없음
```

## 2. Data Model

### 2.1 신규 타입 (types.ts에 추가)

```typescript
/** FR-13: 글자 수 목표 범위 */
export interface CharTarget {
  min: number;
  max: number;
}

/** FR-11: Streaming 콜백 타입 */
export type StreamCallback = (chunk: string, accumulated: string) => void;

/** FR-16: 자동저장 상태 */
export type SaveStatus = 'saved' | 'saving' | 'idle';
```

### 2.2 기존 타입 변경 없음
- WritingStep, ArticleLength, AISuggestion, StepData, ProjectState 유지
- LengthConfig, StepConfig 유지

## 3. API Design

### 3.1 Streaming API 전환 (FR-11)

#### 3.1.1 최종 기사 컴파일 - Streaming 전환

```typescript
/**
 * compileFinalArticle → compileFinalArticleStream으로 전환
 * 기존 일괄 응답 대신 chunk 단위 실시간 출력
 */
export const compileFinalArticleStream = async (
  steps: StepData[],
  originalIdea: string,
  targetLength: ArticleLength,
  onChunk: StreamCallback   // ← 신규: 스트리밍 콜백
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // ... (프롬프트는 v1.0과 동일)

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
    onChunk(text, accumulated);  // UI에 실시간 전달
  }
  return accumulated;
};
```

#### 3.1.2 제안서 생성 - 일괄 응답 유지 + 재시도

```typescript
/**
 * generateWritingSuggestions - JSON Schema 응답이므로 일괄 유지
 * 재시도 로직(FR-14)만 추가
 */
export const generateWritingSuggestions = async (
  step: WritingStep,
  context: string,
  customRequests: string,
  previousSteps: string,
  targetLength: ArticleLength
): Promise<AISuggestion[]> => {
  return withRetry(() => {
    // 기존 generateContent 로직 동일
  }, 3);  // 최대 3회 재시도
};
```

### 3.2 재시도 유틸리티 (FR-14)

```typescript
/**
 * Exponential backoff 재시도 함수
 * geminiService.ts 내부에 구현
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // API_KEY_INVALID 에러는 재시도하지 않음
      if (error.message === 'API_KEY_INVALID') throw error;
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
```

### 3.3 API 변경 요약

| 함수 | v1.0 | v1.1 |
|------|------|------|
| `generateWritingSuggestions` | 일괄 응답 | 일괄 응답 + **withRetry** |
| `compileFinalArticle` | 일괄 응답 | **Streaming** + onChunk 콜백 |
| `withRetry` (신규) | - | exponential backoff (1s/2s/4s) |

## 4. UI Design

### 4.1 MarkdownRenderer 컴포넌트 (FR-12)

```typescript
// components/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    className={className}
    components={{
      // Tailwind 기반 커스텀 스타일링
      h1: ({children}) => <h1 className="text-2xl font-black serif-font mb-4 text-[#001F3F]">{children}</h1>,
      h2: ({children}) => <h2 className="text-xl font-bold serif-font mb-3 text-[#001F3F]">{children}</h2>,
      h3: ({children}) => <h3 className="text-lg font-bold serif-font mb-2 text-[#001F3F]">{children}</h3>,
      p: ({children}) => <p className="text-base leading-relaxed mb-4">{children}</p>,
      strong: ({children}) => <strong className="font-black text-[#001F3F]">{children}</strong>,
      blockquote: ({children}) => (
        <blockquote className="border-l-4 border-[#FF851B] pl-4 my-4 italic text-gray-600">{children}</blockquote>
      ),
      ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
      ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>,
    }}
  />
);
```

**적용 위치**:
- `WritingEditor.tsx` - Editorial Preview 영역 (우측 패널)
- `FinalArticleView.tsx` - 최종 기사 본문 전체

### 4.2 글자 수 카운터 + 진행률 (FR-13)

#### 4.2.1 목표 분량 상수 (constants.tsx 추가)

```typescript
/** 글자 수 목표 범위 (한글 기준) */
export const LENGTH_TARGET_CHARS: Record<ArticleLength, CharTarget> = {
  BRIEF:  { min: 800,  max: 1200 },
  SHORT:  { min: 1800, max: 3200 },
  MEDIUM: { min: 2800, max: 5200 },
  LONG:   { min: 4800, max: 6000 },
};
```

#### 4.2.2 CharCountBar UI (WritingEditor.tsx 내 인라인)

```
┌─────────────────────────────────────────────┐
│  ■■■■■■■■■■■■■■■□□□□□  1,247 / 2,000~3,000 │
│  ────────────────────  62%                   │
└─────────────────────────────────────────────┘
```

- 위치: Content Editor (navy 영역) 하단
- 색상: 진행률 < 50% → gray, 50~80% → orange, 80~100% → green, > 100% → red
- 데이터: `currentStep.userInput.length` vs `LENGTH_TARGET_CHARS[targetLength]`

### 4.3 모바일 Editorial Preview (FR-15)

#### 4.3.1 데스크톱 (>= 1024px)
- 변경 없음: 2-column 레이아웃 (좌 60%, 우 40%)

#### 4.3.2 모바일 (< 1024px)
- 하단 고정 토글 버튼: "프리뷰 보기" / "편집으로 돌아가기"
- 토글 시 전체 화면 슬라이드업 패널로 프리뷰 표시
- 기존 `hidden lg:flex` → 조건부 렌더링으로 변경

```
┌──────────────────────┐
│  [편집 영역]          │  ← 기본 상태
│                      │
│                      │
├──────────────────────┤
│ [📄 프리뷰 보기]     │  ← 하단 고정 토글 버튼
└──────────────────────┘

         ↓ 토글 시

┌──────────────────────┐
│  [Editorial Preview]  │  ← 전체 화면 프리뷰
│  (Markdown 렌더링)    │
│                      │
├──────────────────────┤
│ [✏️ 편집으로 돌아가기]│  ← 하단 고정 토글 버튼
└──────────────────────┘
```

### 4.4 자동저장 인디케이터 (FR-16)

- 위치: 에디터 헤더 우측 (Reset 버튼 옆)
- 상태: `idle` → 표시 없음, `saving` → "저장 중...", `saved` → "저장됨 ✓" (2초 후 fade)
- sessionStorage 쓰기 시 상태 전환

### 4.5 제안서 재생성 (FR-17)

- 기존 "AI 제안서 생성하기" 버튼 유지
- 제안서가 이미 있는 경우 버튼 텍스트를 "다른 시각으로 재생성" 으로 변경
- 동일 API 호출, suggestions 교체

### 4.6 로딩 스켈레톤 (FR-18)

- 제안서 로딩 중: 3개의 카드 형태 스켈레톤 (animate-pulse)
- 최종 기사 생성 중: Streaming 텍스트가 실시간 표시 (스켈레톤 불필요)

```
┌─────────────────────────────────┐
│ ████████████████████             │  ← 제목 스켈레톤
│ ████████████████████████████     │
│ ██████████████████████           │  ← 내용 스켈레톤
│ ████████████████████████████████ │
│                                 │
│ ████ Insight: ████████████████  │  ← 설명 스켈레톤
└─────────────────────────────────┘
 × 3개 카드
```

### 4.7 Streaming 최종 기사 UI (FR-11)

- `FinalArticleView`에 진입 시 텍스트가 chunk 단위로 실시간 렌더링
- Streaming 중 상단에 "기사 작성 중..." 인디케이터 표시
- 완료 후 Copy/PDF 버튼 활성화
- Markdown 렌더링은 `accumulated` 텍스트 전체에 적용 (부분 Markdown도 표시 가능)

## 5. ESM/Importmap 변경 (index.html)

### 5.1 importmap 추가 항목

```json
{
  "imports": {
    "react": "https://esm.sh/react@19.0.0",
    "react-dom": "https://esm.sh/react-dom@19.0.0",
    "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
    "@google/genai": "https://esm.sh/@google/genai@1.3.0",
    "react-markdown": "https://esm.sh/react-markdown@10?external=react",
    "remark-gfm": "https://esm.sh/remark-gfm@4?external=react",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "react/": "https://esm.sh/react@^19.2.3/"
  }
}
```

### 5.2 Vite 모드
- `npm install react-markdown remark-gfm` 추가
- vite.config.ts 변경 불필요 (자동 번들링)

## 6. 구현 순서

| 순서 | 파일 | 작업 | FR |
|------|------|------|-----|
| 1 | types.ts | CharTarget, StreamCallback, SaveStatus 타입 추가 | FR-11,13,16 |
| 2 | constants.tsx | LENGTH_TARGET_CHARS 상수 추가 | FR-13 |
| 3 | index.html | importmap에 react-markdown, remark-gfm 추가 | FR-12 |
| 4 | services/geminiService.ts | withRetry 함수 + compileFinalArticleStream 구현 | FR-11,14 |
| 5 | components/MarkdownRenderer.tsx | 공통 Markdown 컴포넌트 신규 생성 | FR-12 |
| 6 | components/FinalArticleView.tsx | Markdown 렌더링 + Streaming 수신 UI | FR-11,12 |
| 7 | components/WritingEditor.tsx | 글자수, 모바일 프리뷰, 스켈레톤, 저장 인디케이터, 재생성 | FR-13,15,16,17,18 |

## 7. Security Considerations

- v1.0과 동일: API Key는 `.env.local` + `process.env.API_KEY`
- Streaming 응답은 클라이언트에서만 처리 (서버 불필요)
- react-markdown XSS 방지: `remarkPlugins`만 사용, `rehypeRaw` 미사용 (HTML 직접 삽입 차단)
