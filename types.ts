
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
