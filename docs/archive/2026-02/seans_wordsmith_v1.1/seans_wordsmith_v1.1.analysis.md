# Sean's WordSmith v1.1 - Gap Analysis Report

> Analysis Date: 2026-02-05
> Feature: seans_wordsmith_v1.1
> Design Document: `docs/02-design/features/seans_wordsmith_v1.1.design.md`

## 1. Overall Match Rate

| Metric | Value |
|--------|-------|
| **Overall Match Rate** | **96%** |
| Total FRs | 8 |
| Fully Matched | 7 |
| Partially Matched | 1 |
| Not Implemented | 0 |

## 2. FR-by-FR Analysis

### FR-11: Gemini API Streaming 응답 — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| `compileFinalArticleStream` 함수 | `services/geminiService.ts:110-170` | ✅ |
| `generateContentStream` 사용 | `geminiService.ts:146` | ✅ |
| `StreamCallback` (onChunk) 콜백 | `geminiService.ts:114`, `types.ts:56` | ✅ |
| accumulated 텍스트 축적 | `geminiService.ts:155-159` | ✅ |
| FinalArticleView streaming UI | `FinalArticleView.tsx:37-39` "기사 작성 중..." 표시 | ✅ |
| Streaming 중 Copy/PDF 비활성화 | `FinalArticleView.tsx:42-53` disabled={isStreaming} | ✅ |
| Streaming 커서 애니메이션 | `FinalArticleView.tsx:59-61` pulse 커서 | ✅ |
| WritingEditor → FinalArticle 전환 | `WritingEditor.tsx:127-157` 즉시 전환 + 실시간 업데이트 | ✅ |

**Gap**: 없음

---

### FR-12: Markdown 렌더링 — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| `MarkdownRenderer` 공통 컴포넌트 | `components/MarkdownRenderer.tsx` (33줄) | ✅ |
| `react-markdown` + `remark-gfm` 사용 | `MarkdownRenderer.tsx:2-3` | ✅ |
| h1/h2/h3 커스텀 스타일링 | `MarkdownRenderer.tsx:15-17` (serif-font, navy 컬러) | ✅ |
| p/strong/blockquote 스타일링 | `MarkdownRenderer.tsx:18-22` | ✅ |
| ul/ol 스타일링 | `MarkdownRenderer.tsx:24-25` | ✅ |
| Editorial Preview에 적용 | `WritingEditor.tsx:208` | ✅ |
| FinalArticleView에 적용 | `FinalArticleView.tsx:58` | ✅ |
| importmap에 react-markdown/remark-gfm | `index.html:37-38` | ✅ |

**Gap**: 없음. 설계에 없던 `em`, `li`, `hr` 컴포넌트가 추가됨 (개선사항).

---

### FR-13: 글자 수 카운터 + 목표 진행률 — 92%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| `CharTarget` 타입 | `types.ts:50-53` | ✅ |
| `LENGTH_TARGET_CHARS` 상수 | `constants.tsx:18-23` | ✅ |
| 값 일치 (BRIEF 800-1200 등) | `constants.tsx:19-22` 동일 | ✅ |
| 진행률 바 UI | `WritingEditor.tsx:399-404` | ✅ |
| 색상 로직 (gray→orange→green→red) | `WritingEditor.tsx:73` | ✅ |
| "현재/목표" 숫자 표시 | `WritingEditor.tsx:393` | ✅ |
| 퍼센트 표시 | `WritingEditor.tsx:395-397` | ✅ |
| 위치: Content Editor 하단 | `WritingEditor.tsx:389-405` navy 영역 내부 | ✅ |
| 타입 `Record<ArticleLength, CharTarget>` | `Record<string, CharTarget>` 사용 | ⚠️ |

**Gap**:
- **Minor**: `LENGTH_TARGET_CHARS` 타입이 설계의 `Record<ArticleLength, CharTarget>` 대신 `Record<string, CharTarget>`로 선언됨. 기능상 동일하나 타입 안전성이 약간 낮음.

---

### FR-14: API 자동 재시도 (exponential backoff) — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| `withRetry` 함수 | `geminiService.ts:7-23` | ✅ |
| maxRetries 기본값 3 | `geminiService.ts:9` | ✅ |
| baseDelay 기본값 1000ms | `geminiService.ts:10` | ✅ |
| `Math.pow(2, attempt)` 지수 백오프 | `geminiService.ts:18` | ✅ |
| API_KEY_INVALID 즉시 throw | `geminiService.ts:16` | ✅ |
| `generateWritingSuggestions`에 적용 | `geminiService.ts:36` withRetry 래핑 | ✅ |
| `compileFinalArticleStream`에 적용 | `geminiService.ts:116` withRetry 래핑 | ✅ |

**Gap**: 없음. Streaming 함수도 withRetry로 래핑한 것은 설계 대비 개선사항.

---

### FR-15: 모바일 Editorial Preview — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| `showMobilePreview` 상태 | `WritingEditor.tsx:53` | ✅ |
| 하단 고정 토글 "프리뷰 보기" | `WritingEditor.tsx:435-443` lg:hidden | ✅ |
| 전체 화면 슬라이드업 패널 | `WritingEditor.tsx:225-235` fixed inset-0 z-50 | ✅ |
| "편집으로 돌아가기" 버튼 | `WritingEditor.tsx:228-232` | ✅ |
| 데스크톱 기존 2-column 유지 | `WritingEditor.tsx:223,430` lg:flex-row, w-2/5 | ✅ |
| PreviewContent 공유 컴포넌트 | `WritingEditor.tsx:193-220` | ✅ |

**Gap**: 없음. 설계의 ASCII 와이어프레임과 정확히 일치.

---

### FR-16: 자동저장 상태 표시 — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| `SaveStatus` 타입 ('saved'/'saving'/'idle') | `types.ts:58-59` | ✅ |
| `saveStatus` 상태 관리 | `WritingEditor.tsx:52` | ✅ |
| sessionStorage 쓰기 시 상태 전환 | `WritingEditor.tsx:56-63` useEffect | ✅ |
| "저장됨 ✓" 표시 | `WritingEditor.tsx:245-247` | ✅ |
| "저장 중..." 표시 | `WritingEditor.tsx:248-250` | ✅ |
| 위치: Reset 버튼 옆 | `WritingEditor.tsx:244-252` 헤더 우측 | ✅ |
| 2초 후 idle 전환 | `WritingEditor.tsx:61` setTimeout 2000ms | ✅ |

**Gap**: 없음

---

### FR-17: 제안서 재생성 버튼 — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| 제안서 없을 때: "AI 제안서 생성하기" | `WritingEditor.tsx:313` | ✅ |
| 제안서 있을 때: "다른 시각으로 재생성" | `WritingEditor.tsx:313` 조건부 텍스트 | ✅ |
| 동일 API 호출 | `WritingEditor.tsx:309` handleFetchSuggestions 재사용 | ✅ |
| suggestions 교체 | `WritingEditor.tsx:92-97` setState로 교체 | ✅ |

**Gap**: 없음

---

### FR-18: 로딩 스켈레톤 UI — 100%

| Design Spec | Implementation | Status |
|-------------|---------------|--------|
| SkeletonCard 컴포넌트 | `WritingEditor.tsx:178-190` | ✅ |
| animate-pulse 애니메이션 | `WritingEditor.tsx:179` | ✅ |
| 3개 카드 렌더링 | `WritingEditor.tsx:325-327` × 3 | ✅ |
| 제목/내용/설명 스켈레톤 구조 | `WritingEditor.tsx:180-188` | ✅ |
| 조건: isLoading && suggestions 없을 때 | `WritingEditor.tsx:318` | ✅ |
| Streaming 시 스켈레톤 불필요 | FinalArticleView에서 실시간 텍스트 표시 | ✅ |

**Gap**: 없음

---

## 3. Gap Summary

| # | FR | Gap Description | Severity | Impact |
|---|-----|-----------------|----------|--------|
| 1 | FR-13 | `LENGTH_TARGET_CHARS` 타입이 `Record<string, CharTarget>` (설계: `Record<ArticleLength, CharTarget>`) | Low | 기능 동작에 영향 없음, 타입 안전성만 약간 저하 |

## 4. Recommendations

### 4.1 Optional Fix (Low Priority)
```typescript
// constants.tsx - 타입 강화
import { LengthConfig, StepConfig, CharTarget, ArticleLength } from './types.ts';

export const LENGTH_TARGET_CHARS: Record<ArticleLength, CharTarget> = {
  BRIEF:  { min: 800,  max: 1200 },
  SHORT:  { min: 1800, max: 3200 },
  MEDIUM: { min: 2800, max: 5200 },
  LONG:   { min: 4800, max: 6000 },
};
```

### 4.2 Implementation Improvements (Beyond Design)
설계에 없었지만 구현에서 추가된 개선사항:
- `MarkdownRenderer`에 `em`, `li`, `hr` 컴포넌트 추가
- `compileFinalArticleStream`에도 `withRetry` 적용 (설계에는 suggestions만 명시)
- Streaming 에러 시 편집 화면 자동 복귀 로직

## 5. Conclusion

| Category | Score |
|----------|-------|
| Data Model (types.ts) | 100% |
| Constants (constants.tsx) | 92% |
| API Layer (geminiService.ts) | 100% |
| UI Components | 100% |
| ESM/Importmap (index.html) | 100% |
| **Overall Match Rate** | **96%** |

v1.1의 8개 기능 요구사항 모두 구현 완료. 1건의 Minor 타입 갭 외에 설계-구현 간 불일치 없음.
**Check Phase 통과 기준 (90%) 충족.**
