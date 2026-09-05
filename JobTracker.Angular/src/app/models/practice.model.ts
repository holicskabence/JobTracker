export type QuestionCategory = string;
export type FeedbackType = 'correct' | 'incorrect';

export interface PrepQuestion {
  id: number;
  category: QuestionCategory;
  question: string;
  hint: string;
  sampleAnswer: string;
  feedback: FeedbackType | null;
  isHidden: boolean;
}

export interface PracticeCategory {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  isHidden: boolean;
}

export interface PracticeAttempt {
  id: number;
  practiceQuestionId: number;
  category: QuestionCategory;
  question: string;
  userAnswer: string;
  feedback: FeedbackType;
  createdAt: string;
}
