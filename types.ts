
export enum WritingStep {
  TOPIC = 'Topic Smith',
  ANGLE = 'Angle Smith',
  READER = 'Reader Smith',
  STRUCTURE = 'Structure Smith',
  DRAFT = 'Draft Smith',
  FINAL = 'Final Check'
}

export type ArticleLength = 'BRIEF' | 'SHORT' | 'MEDIUM' | 'LONG';

export interface AISuggestion {
  id: string;
  title: string;
  content: string;
  explanation: string;
}

export interface StepData {
  step: WritingStep;
  userInput: string;
  selectedSuggestionId: string | null;
  finalContent: string;
  customRequests: string;
  suggestions: AISuggestion[];
}

export interface ProjectState {
  currentStepIndex: number;
  steps: StepData[];
  originalIdea: string;
  targetLength: ArticleLength;
  finalArticle: string;
}

export interface LengthConfig {
  label: string;
  description: string;
}

export interface StepConfig {
  type: string;
  name: string;
  description: string;
  prompt: string;
}

/** v1.1 FR-13: 글자 수 목표 범위 */
export interface CharTarget {
  min: number;
  max: number;
}

/** v1.1 FR-11: Streaming 콜백 타입 */
export type StreamCallback = (chunk: string, accumulated: string) => void;

/** v1.1 FR-16: 자동저장 상태 */
export type SaveStatus = 'saved' | 'saving' | 'idle';
