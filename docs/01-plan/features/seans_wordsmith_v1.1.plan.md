# Sean's WordSmith v1.1 - Plan Document

## 1. Overview

- **Project Name**: Sean's WordSmith
- **Version**: 1.1 (Enhancement Release)
- **Level**: Dynamic (Fullstack SPA with External API)
- **Base Version**: v1.0 (91% match rate, archived)
- **Description**: v1.0 사용자 경험 개선 및 안정성 강화. Streaming 응답, Markdown 렌더링, 에러 핸들링 개선, 모바일 대응 등.

## 2. Problem Statement

v1.0 사용 중 발견된 UX 및 안정성 이슈:
- AI 응답 대기 시간이 길어 사용자가 진행 상태를 파악하기 어려움 (최대 30초+ 무응답 상태)
- 최종 기사 및 프리뷰에서 Markdown이 렌더링되지 않아 제목/소제목/강조 등이 평문으로 출력
- API 호출 실패 시 자동 재시도 없이 수동 재시도 필요
- 모바일 환경에서 Editorial Preview 패널이 완전히 숨겨짐 (hidden lg:flex)
- 기사 분량 목표 대비 현재 작성 분량을 확인할 방법 없음
- 저장 상태에 대한 시각적 피드백 없음

## 3. Target Users

- v1.0과 동일 (뉴스 기자, 콘텐츠 제작자, 블로거/프리랜서)
- 모바일에서 초안을 작업하는 기자 추가 고려

## 4. Core Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | Category |
|----|------------|----------|----------|
| FR-11 | Gemini API Streaming 응답 (실시간 텍스트 출력) | Must | Performance |
| FR-12 | Markdown 렌더링 (기사 프리뷰 + 최종 기사) | Must | UX |
| FR-13 | 글자 수 카운터 + 목표 분량 진행률 표시 | Must | UX |
| FR-14 | API 호출 실패 시 자동 재시도 (최대 3회, exponential backoff) | Must | Stability |
| FR-15 | 모바일 Editorial Preview (토글 방식 하단 패널) | Should | Mobile |
| FR-16 | 자동저장 상태 표시 (저장됨/저장 중 인디케이터) | Should | UX |
| FR-17 | 제안서 재생성 버튼 (다른 시각으로 다시 생성) | Should | UX |
| FR-18 | 로딩 스켈레톤 UI (제안서 로딩 시) | Should | UX |

### 4.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-11 | Streaming 첫 토큰 응답 2초 이내 | Must |
| NFR-12 | 모바일 (< 768px) 전체 기능 접근 가능 | Should |
| NFR-13 | 번들 사이즈 증가 최소화 (Markdown 라이브러리 경량 선택) | Should |
| NFR-14 | 기존 v1.0 기능 회귀 없음 | Must |

## 5. Tech Stack (Changes from v1.0)

| Category | v1.0 | v1.1 Change |
|----------|------|-------------|
| AI API | Gemini (일괄 응답) | Gemini **Streaming** (generateContentStream) |
| Markdown | 없음 | **react-markdown** + remark-gfm (CDN/ESM) |
| 기타 | - | 변경 없음 (React 19, TypeScript, Tailwind CDN 유지) |

## 6. Scope

### In Scope
- Streaming API 응답 처리
- Markdown 렌더링 (프리뷰 + 최종 기사)
- 글자 수 카운터 + 목표 진행률
- API 재시도 로직 (exponential backoff)
- 모바일 프리뷰 토글
- 자동저장 인디케이터
- 제안서 재생성
- 로딩 스켈레톤

### Out of Scope (v1.1)
- 기사 영구 저장/불러오기 (v2.0)
- 사용자 인증/로그인 (v2.0)
- 다국어 지원 (v2.0)
- 다크 모드 (v2.0)
- 키보드 단축키 (v2.0)

## 7. Success Criteria

- [ ] Streaming 응답으로 첫 토큰 2초 이내 표시
- [ ] 모든 기사 내용이 Markdown 렌더링으로 표시
- [ ] 글자 수 카운터가 목표 분량 대비 진행률을 실시간 표시
- [ ] API 실패 시 자동 재시도 후 복구 성공률 90%+
- [ ] 모바일(768px 이하)에서 Editorial Preview 접근 가능
- [ ] 기존 v1.0 기능 100% 동작 (회귀 없음)

## 8. Implementation Strategy

### 8.1 File Changes (Estimated)

| File | Change Type | Impact |
|------|------------|--------|
| services/geminiService.ts | Major | Streaming API 전환 + 재시도 로직 |
| components/WritingEditor.tsx | Major | Streaming UI, 글자수 카운터, 모바일 프리뷰, 스켈레톤 |
| components/FinalArticleView.tsx | Medium | Markdown 렌더링 적용 |
| components/MarkdownRenderer.tsx | New | 공통 Markdown 렌더링 컴포넌트 |
| types.ts | Minor | Streaming 관련 타입 추가 |
| index.html | Minor | react-markdown ESM import 추가 |
| constants.tsx | No change | - |
| App.tsx | No change | - |

### 8.2 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Streaming API 호환성 (ESM/CDN 환경) | Medium | High | esm.sh로 @google/genai 스트리밍 지원 검증 |
| react-markdown 번들 사이즈 | Low | Medium | esm.sh CDN 사용으로 별도 번들 불필요 |
| 기존 기능 회귀 | Low | High | 단계별 테스트, sessionStorage 호환성 유지 |

## 9. Dependencies

- `react-markdown` (CDN via esm.sh)
- `remark-gfm` (CDN via esm.sh) - GitHub Flavored Markdown 지원
- `@google/genai` v1.3.0 streaming API (기존 설치)

## 10. Estimated Effort

| Phase | Estimated Items |
|-------|----------------|
| Design | 1 document (architecture changes) |
| Implementation | 4-5 files modified, 1 new file |
| Testing | Streaming, Markdown, Mobile, Error retry |
