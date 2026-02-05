# Sean's WordSmith v1.0 - Plan Document

## 1. Overview

- **Project Name**: Sean's WordSmith
- **Version**: 1.0
- **Level**: Dynamic (Fullstack SPA with External API)
- **Description**: AI 기반 프리미엄 기사 작성 에이전트. 단편적인 아이디어를 6단계 저널리즘 워크플로우를 통해 전문 수준의 뉴스 기사로 변환하는 도구.

## 2. Problem Statement

기자 및 콘텐츠 제작자가 아이디어에서 완성된 기사까지 이르는 과정에서 겪는 어려움:
- 아이디어 구체화의 어려움
- 다양한 시각 확보 부족
- 독자 수준에 맞는 용어 해설 누락
- 체계적인 기사 구조 설계 부재
- 팩트체크 미비

## 3. Target Users

- 뉴스 기자 및 편집자
- 콘텐츠 제작자
- 블로거 및 프리랜서 작가

## 4. Core Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| FR-01 | 6단계 저널리즘 워크플로우 제공 (Topic → Angle → Reader → Structure → Draft → Final) | Must |
| FR-02 | 각 단계별 AI 기반 제안서 3개 생성 | Must |
| FR-03 | 기사 분량 선택 (1,000자 / 2,000~3,000자 / 3,000~5,000자 / 5,000자+) | Must |
| FR-04 | Google Search 기반 팩트체크 (Gemini API + Google Search grounding) | Must |
| FR-05 | 실시간 Editorial Preview (우측 패널) | Must |
| FR-06 | 완성 기사 복사(Copy) 및 PDF 출력(Print) | Must |
| FR-07 | 단계별 사용자 커스텀 지시사항 입력 | Should |
| FR-08 | 이전 단계 내용의 논리적 계승 | Must |
| FR-09 | AI Studio API Key 관리 통합 | Must |

### 4.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-01 | SPA (Single Page Application) 구조 | Must |
| NFR-02 | 반응형 디자인 (Desktop 우선, Mobile 지원) | Should |
| NFR-03 | 한국어 UI/UX | Must |
| NFR-04 | 기자 문체 통일 (~했다, ~이다) | Must |

## 5. Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS (CDN) |
| Build Tool | Vite 6 |
| AI API | Google Gemini (gemini-3-flash-preview) |
| Search/Factcheck | Gemini Google Search Grounding |
| Font | Noto Serif KR, Pretendard |

## 6. Success Criteria

- 6단계 워크플로우 완전 동작
- AI 제안서 생성 및 선택/수정 가능
- 4가지 분량 옵션 동작
- 팩트체크 지침이 AI 프롬프트에 통합
- 최종 기사 복사/출력 가능

## 7. Scope

### In Scope
- 6단계 기사 작성 워크플로우
- Gemini API 연동 및 Google Search grounding
- Landing Page + Writing Editor + Final Article View
- 기사 분량 선택 시스템

### Out of Scope (v1.0)
- 기사 저장/불러오기 (영구 저장)
- 사용자 인증/로그인
- 기사 히스토리 관리
- 다국어 지원 (한국어 only)
- 모바일 최적화
