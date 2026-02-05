import React, { useState } from 'react';
import { ArticleLength } from '../types.ts';
import { LENGTH_CONFIG } from '../constants.tsx';

interface LandingPageProps {
  onStart: (idea: string, length: ArticleLength) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
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

export default LandingPage;
