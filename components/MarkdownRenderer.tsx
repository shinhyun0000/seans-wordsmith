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
      h1: ({children}) => <h1 className="text-2xl font-black serif-font mb-4 text-[#001F3F]">{children}</h1>,
      h2: ({children}) => <h2 className="text-xl font-bold serif-font mb-3 text-[#001F3F]">{children}</h2>,
      h3: ({children}) => <h3 className="text-lg font-bold serif-font mb-2 text-[#001F3F]">{children}</h3>,
      p: ({children}) => <p className="text-base leading-relaxed mb-4">{children}</p>,
      strong: ({children}) => <strong className="font-black text-[#001F3F]">{children}</strong>,
      em: ({children}) => <em className="italic text-gray-700">{children}</em>,
      blockquote: ({children}) => (
        <blockquote className="border-l-4 border-[#FF851B] pl-4 my-4 italic text-gray-600">{children}</blockquote>
      ),
      ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
      ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>,
      li: ({children}) => <li className="text-base leading-relaxed">{children}</li>,
      hr: () => <hr className="my-6 border-gray-200" />,
    }}
  />
);

export default MarkdownRenderer;
