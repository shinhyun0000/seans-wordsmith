import React, { useState } from 'react';
import { ArticleLength } from './types.ts';
import LandingPage from './components/LandingPage.tsx';
import WritingEditor from './components/WritingEditor.tsx';

const App: React.FC = () => {
  const [initialData, setInitialData] = useState<{idea: string, length: ArticleLength} | null>(null);
  return initialData
    ? <WritingEditor initialIdea={initialData.idea} targetLength={initialData.length} onReset={() => setInitialData(null)} />
    : <LandingPage onStart={(idea, length) => setInitialData({idea, length})} />;
};

export default App;
