import React, { useState } from 'react';
import { WritingStep, ProjectState, ArticleLength } from './types.ts';
import { STEPS_CONFIG, ICONS, LENGTH_CONFIG } from './constants.tsx';
import { generateWritingSuggestions } from './services/geminiService.ts';

const LandingPage: React.FC<{ onStart: (idea: string, length: ArticleLength) => void }> = ({ onStart }) => {
  const [idea, setIdea] = useState('');
  const [length, setLength] = useState<ArticleLength>('SHORT');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    try {
      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
          await aiStudio.openSelectKey();
        }
      }
      onStart(idea, length);
    } catch (e) {
      console.error("Key selection failed", e);
      onStart(idea, length);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FDFCF8] fade-in">
      <div className="max-w-4xl w-full text-center flex flex-col items-center">
        <div className="w-full flex flex-col items-center justify-center mb-10">
          <img src="./logo.png" alt="Sean's WordSmith Logo" className="w-72 h-72 md:w-96 md:h-96 object-contain" />
        </div>
        
        <h1 className="text-xl md:text-2xl text-[#001F3F] mb-12 leading-relaxed tracking-tight px-4 opacity-90 serif-font">
          복잡한 이슈를 독자의 입장에서 <br/>
          쉽게 다양한 시각으로 조명하는 <br/>
          <span className="font-bold text-[#FF851B] block mt-3 text-3xl md:text-4xl">기사 작성 에이전트</span>
        </h1>
        
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-gray-100 w-full max-w-2xl mx-auto space-y-8">
          <div className="text-left">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">기사 주제 및 초기 아이디어</label>
            <textarea 
              className="w-full h-36 p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#FF851B]/20 focus:border-[#FF851B] outline-none text-lg transition-all placeholder:text-gray-300 resize-none" 
              placeholder="기사의 모티브가 되는 주제나 메모를 입력하세요..." 
              value={idea} 
              onChange={(e) => setIdea(e.target.value)} 
            />
          </div>

          <div className="text-left">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">목표 기사 분량 선택</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(LENGTH_CONFIG) as ArticleLength[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setLength(key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-32 ${length === key ? 'border-[#FF851B] bg-orange-50 shadow-md scale-[1.03]' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className={`text-xs font-black ${length === key ? 'text-[#FF851B]' : 'text-[#001F3F]'}`}>{LENGTH_CONFIG[key].label.split(' ')[0]}</div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-auto font-medium">{LENGTH_CONFIG[key].description}</div>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleStart} 
            disabled={!idea.trim() || loading}
            className={`w-full py-6 rounded-2xl text-white font-black text-xl shadow-xl transition-all ${idea.trim() ? 'bg-[#FF851B] hover:bg-[#E67716] active:scale-[0.98] shadow-orange-200' : 'bg-gray-200 cursor-not-allowed text-gray-400'}`}
          >
            {loading ? '엔진 가동 중...' : '기사 설계 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

const WritingEditor: React.FC<{ initialIdea: string; targetLength: ArticleLength; onReset: () => void }> = ({ initialIdea, targetLength, onReset }) => {
  const [state, setState] = useState<ProjectState>({
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState(false);

  const currentStep = state.steps[state.currentStepIndex];
  const stepConfig = STEPS_CONFIG[state.currentStepIndex];

  const handleFetchSuggestions = async () => {
    setIsLoading(true);
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
        const newSteps = [...prev.steps];
        newSteps[state.currentStepIndex].suggestions = suggestions;
        return { ...prev, steps: newSteps };
      });
    } catch (err: any) {
      if (err.message === "API_KEY_INVALID" && (window as any).aistudio) {
        alert("유효한 유료 API 키가 필요합니다. 키 선택 창을 다시 엽니다.");
        await (window as any).aistudio.openSelectKey();
      } else {
        alert("오류가 발생했습니다: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeStep = async () => {
    if (!currentStep.userInput) return;
    
    const updatedSteps = [...state.steps];
    updatedSteps[state.currentStepIndex].finalContent = currentStep.userInput;

    if (state.currentStepIndex < STEPS_CONFIG.length - 1) {
      const nextIndex = state.currentStepIndex + 1;
      setState(prev => ({ 
        ...prev, 
        steps: updatedSteps, 
        currentStepIndex: nextIndex 
      }));
      setMaxReachedIndex(prev => Math.max(prev, nextIndex));
    } else {
      setIsFinalizing(true);
      try {
        const fullText = updatedSteps.map(s => s.finalContent).join('\n\n');
        setState(prev => ({ ...prev, steps: updatedSteps, finalArticle: fullText }));
      } catch (err) {
        alert("발행 오류가 발생했습니다.");
      } finally {
        setIsFinalizing(false);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.finalArticle);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  if (state.finalArticle) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-white min-h-screen shadow-lg fade-in print-container relative">
        <div className="flex justify-between items-center mb-12 no-print">
          <button onClick={onReset} className="text-gray-400 font-bold hover:text-black transition-colors">&larr; NEW ARTICLE</button>
          
          <div className="flex items-center gap-2">
            <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all">
              {copyStatus ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-[#FF851B] text-white hover:bg-[#E67716] rounded-lg text-xs font-bold transition-all">PDF</button>
          </div>
        </div>

        <article className="serif-font mx-auto">
          <div className="space-y-8">
            {state.finalArticle.split('\n\n').map((para, i) => (
              <p key={i} className="text-xl leading-relaxed text-gray-800 tracking-tight">{para}</p>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDFCF8] fade-in">
      <div className="w-full lg:w-3/5 p-8 lg:p-12 border-r border-gray-200 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <ICONS.Logo className="w-16 h-16" />
            <h2 className="text-xl font-bold text-[#001F3F] serif-font hidden md:block">Editorial Workspace</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black bg-orange-100 text-[#FF851B] px-3 py-1 rounded-full">{LENGTH_CONFIG[state.targetLength].label}</span>
            <button onClick={onReset} className="text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest">Reset</button>
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
              onChange={(e) => setState(prev => {
                const ns = [...prev.steps];
                ns[state.currentStepIndex].customRequests = e.target.value;
                return { ...prev, steps: ns };
              })}
            />
            <button 
              onClick={handleFetchSuggestions} 
              disabled={isLoading}
              className={`mt-6 w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isLoading ? 'bg-gray-100 text-gray-400 animate-pulse' : 'bg-[#FF851B] text-white hover:bg-[#E67716] active:scale-[0.99] shadow-orange-100'}`}
            >
              {isLoading ? 'AI 편집국 분석 중...' : 'AI 제안서 생성하기'}
            </button>
          </div>

          {currentStep.suggestions.length > 0 && (
            <div className="space-y-4 fade-in">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                AI Editorial Suggestions
              </h3>
              <div className="grid gap-4">
                {currentStep.suggestions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setState(prev => {
                      const ns = [...prev.steps];
                      ns[state.currentStepIndex].userInput = s.content;
                      ns[state.currentStepIndex].selectedSuggestionId = s.id;
                      return { ...prev, steps: ns };
                    })}
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
              onChange={(e) => setState(prev => {
                const ns = [...prev.steps];
                ns[state.currentStepIndex].userInput = e.target.value;
                return { ...prev, steps: ns };
              })}
            />
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
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
      
      <div className="hidden lg:flex w-2/5 p-12 bg-white flex-col border-l border-gray-100 overflow-y-auto custom-scrollbar">
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
              <div className={`text-sm leading-relaxed serif-font ${i === state.currentStepIndex ? 'text-[#001F3F] font-bold' : 'text-gray-400 italic'}`}>
                {s.finalContent || s.userInput}
              </div>
            </div>
          ))}
          {!state.steps.some(s => s.finalContent || s.userInput) && (
            <div className="text-center py-32 opacity-20 flex flex-col items-center">
              <ICONS.Logo className="w-24 h-24 grayscale mb-6 opacity-30" />
              <p className="text-xs font-black serif-font leading-relaxed tracking-widest uppercase">Initializing Editor...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [initialData, setInitialData] = useState<{idea: string, length: ArticleLength} | null>(null);
  return initialData ? <WritingEditor initialIdea={initialData.idea} targetLength={initialData.length} onReset={() => setInitialData(null)} /> : <LandingPage onStart={(idea, length) => setInitialData({idea, length})} />;
};

export default App;