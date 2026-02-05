# Sean's WordSmith v1.0 - Design Document

## 1. Architecture Overview

### 1.1 Application Type
- Single Page Application (React SPA)
- Client-side only (no backend server)
- External API: Google Gemini API with Google Search Grounding

### 1.2 Component Architecture

```
App (Root)
├── LandingPage          # 아이디어 입력 + 분량 선택
├── WritingEditor        # 6단계 작성 에디터
│   ├── StepNavigation   # 상단 단계 네비게이터
│   ├── InstructionPanel # 지시사항 입력 + AI 제안 생성
│   ├── SuggestionList   # AI 제안서 목록
│   ├── ContentEditor    # 최종 본문 편집 영역
│   └── EditorialPreview # 우측 실시간 프리뷰
└── FinalArticleView     # 완성 기사 보기 (Copy/Print)
```

### 1.3 Directory Structure

```
seans_wordsmith_v1.0/
├── components/
│   ├── LandingPage.tsx
│   ├── WritingEditor.tsx
│   ├── FinalArticleView.tsx
│   └── Logo.tsx
├── services/
│   └── geminiService.ts
├── types.ts
├── constants.tsx
├── App.tsx              # Root component (routing)
├── index.tsx            # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.local           # API keys (gitignored)
├── .env.example         # Template
└── docs/
    ├── 01-plan/
    └── 02-design/
```

## 2. Data Model

### 2.1 Core Types

```typescript
enum WritingStep {
  TOPIC = 'Topic Smith',
  ANGLE = 'Angle Smith',
  READER = 'Reader Smith',
  STRUCTURE = 'Structure Smith',
  DRAFT = 'Draft Smith',
  FINAL = 'Final Check'
}

type ArticleLength = 'BRIEF' | 'SHORT' | 'MEDIUM' | 'LONG';

interface AISuggestion {
  id: string;
  title: string;
  content: string;
  explanation: string;
}

interface StepData {
  step: WritingStep;
  userInput: string;
  selectedSuggestionId: string | null;
  finalContent: string;
  customRequests: string;
  suggestions: AISuggestion[];
}

interface ProjectState {
  currentStepIndex: number;
  steps: StepData[];
  originalIdea: string;
  targetLength: ArticleLength;
  finalArticle: string;
}
```

### 2.2 Configuration Types

```typescript
interface LengthConfig {
  label: string;
  description: string;
}

interface StepConfig {
  type: string;
  name: string;
  description: string;
  prompt: string;
}
```

## 3. API Design

### 3.1 Gemini API Integration

| Item | Value |
|------|-------|
| Model | gemini-3-flash-preview |
| SDK | @google/genai v1.3.0 |
| Response Format | JSON (structured schema) |
| Grounding | Google Search enabled |

### 3.2 Request Schema

```typescript
generateWritingSuggestions(
  step: WritingStep,
  context: string,        // 원본 아이디어
  customRequests: string,  // 사용자 지시사항
  previousSteps: string,   // 이전 단계 확정 내용
  targetLength: ArticleLength
): Promise<AISuggestion[]>
```

### 3.3 Response Schema

```json
{
  "suggestions": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "explanation": "string"
    }
  ]
}
```

### 3.4 System Prompt

편집국장 역할 부여 + 데이터 정확성 지침:
1. Google Search 기반 최신 정보 사용
2. 확인 불가 수치에 [팩트체크 필요] 태그 부착
3. 학습 데이터 의존 추정치 금지
4. 최신 날짜 기준 정보 반영

## 4. UI Design

### 4.1 Color System

| Token | Value | Usage |
|-------|-------|-------|
| Navy (Primary) | #001F3F | 헤더, 본문 편집 영역 |
| Orange (Accent) | #FF851B | CTA 버튼, 활성 상태, 강조 |
| Cream (Background) | #FDFCF8 | 전체 배경 |
| White | #FFFFFF | 카드, 패널 |

### 4.2 Typography

| Font | Usage |
|------|-------|
| Noto Serif KR | 기사 본문, 제목 (serif-font) |
| Pretendard | UI 요소, 버튼, 레이블 |

### 4.3 Screens

#### Landing Page
- 로고 이미지 (logo.png)
- 부제: "복잡한 이슈를 독자의 입장에서 쉽게 다양한 시각으로 조명하는 기사 작성 에이전트"
- 주제 입력 textarea
- 분량 선택 (4옵션 그리드)
- "기사 설계 시작하기" 버튼

#### Writing Editor (2-column layout)
- **Left (60%)**: Step Navigation + Instruction Input + AI Suggestions + Content Editor
- **Right (40%)**: Editorial Preview (실시간 단계별 미리보기)

#### Final Article View
- 전체 기사 출력
- NEW ARTICLE / Copy / PDF 버튼

### 4.4 Interactions

- Step Navigation: 순차 진행, 이전 단계 자유 이동, 미래 단계 잠금
- AI 제안 선택 시 Content Editor에 자동 반영
- 마지막 단계에서 "기사 발행하기" → Final Article View 전환

## 5. Security Considerations

- API Key는 `.env.local`에 보관 (gitignored)
- Vite define으로 빌드 시 주입 (클라이언트 노출 주의)
- AI Studio 환경에서 `window.aistudio` API Key 관리 통합
