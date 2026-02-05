import React, { useState, useEffect } from 'react';
import { WritingStep, ProjectState, ArticleLength, SaveStatus } from '../types.ts';
import { STEPS_CONFIG, LENGTH_CONFIG, LENGTH_TARGET_CHARS } from '../constants.tsx';
import { generateWritingSuggestions, compileFinalArticleStream } from '../services/geminiService.ts';
import Logo from './Logo.tsx';
import FinalArticleView from './FinalArticleView.tsx';
import MarkdownRenderer from './MarkdownRenderer.tsx';

interface WritingEditorProps {
  initialIdea: string;
  targetLength: ArticleLength;
  onReset: () => void;
}

const STORAGE_KEY = 'wordsmith_draft';

const WritingEditor: React.FC<WritingEditorProps> = ({ initialIdea, targetLength, onReset }) => {
  const [state, setState] = useState<ProjectState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.originalIdea === initialIdea && parsed.targetLength === targetLength) {
          return parsed;
        }
      }
    } catch {}
    return {
      currentStepIndex: 0,
      steps: STEPS_CONFIG.map(config => ({
        step: config.name as WritingStep,
        userInput: '',
        selectedSuggestionId: null,
        finalContent: '',
        customRequests: '',
        suggestions: []
      })),
      originalIdea: initialIdea,
      targetLength,
      finalArticle: ''
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [maxReachedIndex, setMaxReachedIndex] = useState(() => {
    const lastCompleted = state.steps.findLastIndex(s => s.finalContent);
    return Math.max(0, lastCompleted + 1, state.currentStepIndex);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // FR-16: 자동저장 with 상태 표시
  useEffect(() => {
    if (!state.finalArticle) {
      setSaveStatus('saving');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveStatus('saved');
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const currentStep = state.steps[state.currentStepIndex];
  const stepConfig = STEPS_CONFIG[state.currentStepIndex];

  // FR-13: 글자 수 계산
  const charTarget = LENGTH_TARGET_CHARS[state.targetLength];
  const currentCharCount = currentStep.userInput.length;
  const charPercent = charTarget.max > 0 ? Math.round((currentCharCount / charTarget.max) * 100) : 0;
  const charBarColor = charPercent > 100 ? 'bg-red-500' : charPercent >= 80 ? 'bg-green-500' : charPercent >= 50 ? 'bg-[#FF851B]' : 'bg-gray-400';

  const handleFetchSuggestions = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const prevContext = state.steps
      .slice(0, state.currentStepIndex)
      .filter(s => s.finalContent)
      .map((s, idx) => `Step ${idx + 1} [${s.step}]: ${s.finalContent}`)
      .join('\n\n');

    try {
      const suggestions = await generateWritingSuggestions(
        currentStep.step,
        state.originalIdea,
        currentStep.customRequests,
        prevContext,
        state.targetLength
      );
      setState(prev => {
        const newSteps = prev.steps.map((s, i) =>
          i === prev.currentStepIndex ? { ...s, suggestions } : s
        );
        return { ...prev, steps: newSteps };
      });
    } catch (err: any) {
      if (err.message === "API_KEY_INVALID" && (window as any).aistudio) {
        setErrorMsg("유효한 유료 API 키가 필요합니다. 키 선택 창을 다시 엽니다.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setErrorMsg("AI 제안 생성에 실패했습니다: " + (err.message || "알 수 없는 오류"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // FR-11: Streaming 최종 기사
  const handleFinalizeStep = async () => {
    if (!currentStep.userInput) return;

    const isLastStep = state.currentStepIndex === STEPS_CONFIG.length - 1;

    if (!isLastStep) {
      setState(prev => {
        const updatedSteps = prev.steps.map((s, i) =>
          i === prev.currentStepIndex ? { ...s, finalContent: s.userInput } : s
        );
        const nextIndex = prev.currentStepIndex + 1;
        setMaxReachedIndex(m => Math.max(m, nextIndex));
        return { ...prev, steps: updatedSteps, currentStepIndex: nextIndex };
      });
    } else {
      setIsFinalizing(true);
      setIsStreaming(true);
      try {
        const updatedSteps = state.steps.map((s, i) =>
          i === state.currentStepIndex ? { ...s, finalContent: s.userInput } : s
        );
        // 즉시 FinalArticleView로 전환 (빈 문자열로 시작)
        setState(prev => ({ ...prev, steps: updatedSteps, finalArticle: ' ' }));

        const finalText = await compileFinalArticleStream(
          updatedSteps,
          state.originalIdea,
          state.targetLength,
          (_chunk, accumulated) => {
            setState(prev => ({ ...prev, finalArticle: accumulated }));
          }
        );
        setState(prev => ({ ...prev, finalArticle: finalText }));
      } catch (err: any) {
        // 에러 시 편집 화면으로 복귀
        setState(prev => ({ ...prev, finalArticle: '' }));
        if (err.message === "API_KEY_INVALID" && (window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
        } else {
          setErrorMsg("최종 기사 편집에 실패했습니다. 다시 시도해주세요.");
        }
      } finally {
        setIsFinalizing(false);
        setIsStreaming(false);
      }
    }
  };

  const handlePrevStep = () => {
    if (state.currentStepIndex > 0) {
      setState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1
      }));
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onReset();
  };

  if (state.finalArticle) {
    return <FinalArticleView finalArticle={state.finalArticle} isStreaming={isStreaming} onReset={handleReset} />;
  }

  // FR-18: 스켈레톤 카드
  const SkeletonCard = () => (
    <div className="p-6 rounded-3xl border-2 border-white bg-white shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full"></div>
        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
        <div className="h-3 bg-gray-100 rounded w-4/6"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="h-3 bg-orange-100 rounded w-2/3"></div>
      </div>
    </div>
  );

  // Editorial Preview 콘텐츠 (데스크톱 + 모바일 공유)
  const PreviewContent = () => (
    <>
      <h1 className="text-xl font-black text-[#001F3F] serif-font mb-12 border-b-2 border-gray-50 pb-6 flex items-center justify-between">
        <span className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[#FF851B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l5 5v11a2 2 0 01-2 2z" /></svg>
          Editorial Preview
        </span>
        <span className="text-[10px] bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase tracking-tighter">Real-time Draft</span>
      </h1>
      <div className="space-y-12">
        {state.steps.map((s, i) => (s.finalContent || (i === state.currentStepIndex && s.userInput)) && (
          <div key={i} className={`relative pl-10 border-l-2 transition-all duration-700 ${i === state.currentStepIndex ? 'border-[#FF851B]' : 'border-gray-100 opacity-60'}`}>
            <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === state.currentStepIndex ? 'bg-[#FF851B] text-white shadow-xl scale-110' : 'bg-[#001F3F] text-white'}`}>{i + 1}</div>
            <div className="text-[11px] font-black text-[#FF851B] mb-3 uppercase tracking-[0.2em]">{s.step}</div>
            <div className={`text-sm leading-relaxed serif-font ${i === state.currentStepIndex ? 'text-[#001F3F]' : 'text-gray-400 italic'}`}>
              <MarkdownRenderer content={s.finalContent || s.userInput} />
            </div>
          </div>
        ))}
        {!state.steps.some(s => s.finalContent || s.userInput) && (
          <div className="text-center py-32 opacity-20 flex flex-col items-center">
            <Logo className="w-24 h-24 grayscale mb-6 opacity-30" />
            <p className="text-xs font-black serif-font leading-relaxed tracking-widest uppercase">Initializing Editor...</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDFCF8] fade-in">
      {/* FR-15: 모바일 프리뷰 오버레이 */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 bg-white p-8 overflow-y-auto custom-scrollbar lg:hidden fade-in">
          <PreviewContent />
          <button
            onClick={() => setShowMobilePreview(false)}
            className="fixed bottom-0 left-0 right-0 py-5 bg-[#001F3F] text-white font-black text-sm uppercase tracking-widest text-center z-50"
          >
            편집으로 돌아가기
          </button>
        </div>
      )}

      <div className="w-full lg:w-3/5 p-8 lg:p-12 border-r border-gray-200 overflow-y-auto custom-scrollbar pb-24 lg:pb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Logo className="w-16 h-16" />
            <h2 className="text-xl font-bold text-[#001F3F] serif-font hidden md:block">Editorial Workspace</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* FR-16: 자동저장 인디케이터 */}
            {saveStatus === 'saved' && (
              <span className="text-[10px] text-green-500 font-bold transition-opacity">저장됨 ✓</span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-[10px] text-gray-400 font-bold animate-pulse">저장 중...</span>
            )}
            <span className="text-[10px] font-black bg-orange-100 text-[#FF851B] px-3 py-1 rounded-full">{LENGTH_CONFIG[state.targetLength].label}</span>
            <button onClick={handleReset} className="text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest">Reset</button>
          </div>
        </div>

        <div className="w-full py-6 px-4 mb-10 border-b border-gray-100 overflow-x-auto bg-white/50 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between min-w-[600px]">
            {STEPS_CONFIG.map((step, idx) => {
              const isCompleted = idx < state.currentStepIndex;
              const isActive = idx === state.currentStepIndex;
              const isLocked = idx > maxReachedIndex;
              return (
                <React.Fragment key={idx}>
                  <div
                    className={`flex flex-col items-center group relative transition-all ${isLocked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                    onClick={() => !isLocked && setState(prev => ({...prev, currentStepIndex: idx}))}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all ${isActive ? 'bg-[#FF851B] text-white ring-8 ring-orange-50' : isCompleted ? 'bg-[#001F3F] text-white shadow-lg' : 'bg-white border-2 border-gray-100 text-gray-300'}`}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className={`absolute -bottom-8 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-[#FF851B]' : 'text-gray-400'}`}>{step.name}</span>
                  </div>
                  {idx < STEPS_CONFIG.length - 1 && <div className="flex-1 px-4"><div className={`h-[2px] transition-all duration-500 ${idx < state.currentStepIndex ? 'bg-[#001F3F]' : 'bg-gray-100'}`} /></div>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between fade-in">
            <span className="text-sm text-red-700 font-medium">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 font-black text-xs ml-4">닫기</button>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-[#001F3F] mb-6 serif-font flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF851B] rounded-full"></span>
              {state.currentStepIndex + 1}. {stepConfig.name} 지시사항
            </h3>
            <textarea
              className="w-full h-28 p-5 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
              placeholder={`${stepConfig.name} 단계에서 특별히 강조하고 싶은 내용을 입력하세요.`}
              value={currentStep.customRequests}
              onChange={(e) => {
                const val = e.target.value;
                setState(prev => ({
                  ...prev,
                  steps: prev.steps.map((s, i) =>
                    i === prev.currentStepIndex ? { ...s, customRequests: val } : s
                  )
                }));
              }}
            />
            {/* FR-17: 제안서 생성/재생성 버튼 */}
            <button
              onClick={handleFetchSuggestions}
              disabled={isLoading}
              className={`mt-6 w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isLoading ? 'bg-gray-100 text-gray-400 animate-pulse' : 'bg-[#FF851B] text-white hover:bg-[#E67716] active:scale-[0.99] shadow-orange-100'}`}
            >
              {isLoading ? 'AI 편집국 분석 중...' : currentStep.suggestions.length > 0 ? '다른 시각으로 재생성' : 'AI 제안서 생성하기'}
            </button>
          </div>

          {/* FR-18: 스켈레톤 로딩 */}
          {isLoading && currentStep.suggestions.length === 0 && (
            <div className="space-y-4 fade-in">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <svg className="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                AI Editorial Suggestions 생성 중...
              </h3>
              <div className="grid gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {currentStep.suggestions.length > 0 && !isLoading && (
            <div className="space-y-4 fade-in">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                AI Editorial Suggestions
              </h3>
              <div className="grid gap-4">
                {currentStep.suggestions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      const content = s.content;
                      const id = s.id;
                      setState(prev => ({
                        ...prev,
                        steps: prev.steps.map((step, i) =>
                          i === prev.currentStepIndex ? { ...step, userInput: content, selectedSuggestionId: id } : step
                        )
                      }));
                    }}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${currentStep.selectedSuggestionId === s.id ? 'border-[#FF851B] bg-orange-50 shadow-md' : 'border-white bg-white hover:border-gray-100 shadow-sm'}`}
                  >
                    <h4 className="font-black text-[#001F3F] mb-3 text-base flex items-center justify-between">
                      {s.title}
                      {currentStep.selectedSuggestionId === s.id && <span className="text-[#FF851B] text-[10px] font-black border border-[#FF851B] px-2 py-0.5 rounded-full uppercase">Selected</span>}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{s.content}</p>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-[#FF851B] font-black uppercase tracking-widest italic">
                      Insight: {s.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#001F3F] p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <h3 className="text-white font-black text-xl mb-6 serif-font flex items-center gap-3">
              <span className="w-1 h-6 bg-[#FF851B]"></span>
              이 단계의 최종 기사 본문
            </h3>
            <textarea
              className="w-full h-56 p-6 bg-white/5 border-2 border-white/10 rounded-3xl text-white/90 text-base leading-relaxed focus:ring-2 focus:ring-[#FF851B]/30 focus:border-[#FF851B] outline-none shadow-inner transition-all resize-none"
              placeholder="제안을 수정하거나 내용을 직접 완성하세요."
              value={currentStep.userInput}
              onChange={(e) => {
                const val = e.target.value;
                setState(prev => ({
                  ...prev,
                  steps: prev.steps.map((s, i) =>
                    i === prev.currentStepIndex ? { ...s, userInput: val } : s
                  )
                }));
              }}
            />

            {/* FR-13: 글자 수 카운터 + 진행률 바 */}
            <div className="mt-4 px-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-white/40 font-bold">
                  {currentCharCount.toLocaleString()}자 / {charTarget.min.toLocaleString()}~{charTarget.max.toLocaleString()}자
                </span>
                <span className={`text-[10px] font-black ${charPercent > 100 ? 'text-red-400' : charPercent >= 80 ? 'text-green-400' : 'text-white/40'}`}>
                  {charPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${charBarColor}`}
                  style={{ width: `${Math.min(charPercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-[10px] text-white/30 space-y-1.5 w-full font-medium">
                <p>● 이 단계의 확정 내용이 다음 단계의 AI 지시문에 포함됩니다.</p>
                <p>● 목표 분량 가이드라인을 준수하여 문장을 다듬어주세요.</p>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                {state.currentStepIndex > 0 && (
                  <button onClick={handlePrevStep} className="flex-1 sm:flex-none py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all bg-white/5 text-white hover:bg-white/10 border border-white/10">이전</button>
                )}
                <button
                  onClick={handleFinalizeStep}
                  disabled={!currentStep.userInput || isLoading}
                  className={`flex-1 sm:flex-none py-4 px-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${currentStep.userInput ? 'bg-[#FF851B] text-white hover:scale-105 shadow-2xl active:scale-[0.98]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                >
                  {isFinalizing ? '발행 중...' : (state.currentStepIndex === STEPS_CONFIG.length - 1 ? '기사 발행하기' : '다음 단계로')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 데스크톱 프리뷰 */}
      <div className="hidden lg:flex w-2/5 p-12 bg-white flex-col border-l border-gray-100 overflow-y-auto custom-scrollbar">
        <PreviewContent />
      </div>

      {/* FR-15: 모바일 프리뷰 토글 버튼 */}
      {!showMobilePreview && (
        <button
          onClick={() => setShowMobilePreview(true)}
          className="fixed bottom-0 left-0 right-0 py-4 bg-[#001F3F] text-white font-black text-xs uppercase tracking-widest text-center lg:hidden z-40 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l5 5v11a2 2 0 01-2 2z" /></svg>
          프리뷰 보기
        </button>
      )}
    </div>
  );
};

export default WritingEditor;
