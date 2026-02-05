import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.tsx';

interface FinalArticleViewProps {
  finalArticle: string;
  isStreaming?: boolean;
  onReset: () => void;
}

const FinalArticleView: React.FC<FinalArticleViewProps> = ({ finalArticle, isStreaming = false, onReset }) => {
  const [copyStatus, setCopyStatus] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalArticle);
      setCopyStatus(true);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = finalArticle;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyStatus(true);
    }
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-12 bg-white min-h-screen shadow-lg fade-in print-container relative">
      <div className="flex justify-between items-center mb-12 no-print">
        <button onClick={onReset} className="text-gray-400 font-bold hover:text-black transition-colors">&larr; NEW ARTICLE</button>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="text-xs text-[#FF851B] font-bold animate-pulse">기사 작성 중...</span>
          )}
          <button
            onClick={copyToClipboard}
            disabled={isStreaming}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${isStreaming ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {copyStatus ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => window.print()}
            disabled={isStreaming}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isStreaming ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FF851B] text-white hover:bg-[#E67716]'}`}
          >
            PDF
          </button>
        </div>
      </div>

      <article className="serif-font mx-auto">
        <MarkdownRenderer content={finalArticle} className="text-gray-800 tracking-tight" />
        {isStreaming && (
          <span className="inline-block w-2 h-5 bg-[#FF851B] animate-pulse ml-1 align-text-bottom" />
        )}
      </article>
    </div>
  );
};

export default FinalArticleView;
