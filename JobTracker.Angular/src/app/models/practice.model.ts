export type QuestionCategory = string;
export type FeedbackType = 'correct' | 'incorrect';

export interface PrepQuestion {
  id: number;
  category: QuestionCategory;
  question: string;
  hint: string;
  sampleAnswer: string;
  feedback: FeedbackType | null;
}

export interface PracticeCategory {
  id: number;
  name: string;
  color: string;
}
