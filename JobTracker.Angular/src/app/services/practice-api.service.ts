import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeedbackType, PracticeAttempt, PracticeCategory, PrepQuestion, QuestionCategory } from '../models/practice.model';

export interface CreatePracticeQuestionPayload {
  category: QuestionCategory;
  question: string;
  hint: string;
  sampleAnswer: string;
}

export type UpdatePracticeQuestionPayload = CreatePracticeQuestionPayload;

export interface CreatePracticeCategoryPayload {
  name: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class PracticeApiService {
  constructor(private readonly http: HttpClient) { }

  getQuestions(): Observable<PrepQuestion[]> {
    return this.http.get<PrepQuestion[]>('/api/practice-questions');
  }

  createQuestion(data: CreatePracticeQuestionPayload): Observable<PrepQuestion> {
    return this.http.post<PrepQuestion>('/api/practice-questions', data);
  }

  createQuestions(questions: CreatePracticeQuestionPayload[]): Observable<PrepQuestion[]> {
    return this.http.post<PrepQuestion[]>('/api/practice-questions/bulk', { questions });
  }

  updateQuestion(id: number, data: UpdatePracticeQuestionPayload): Observable<PrepQuestion> {
    return this.http.put<PrepQuestion>(`/api/practice-questions/${id}`, data);
  }

  rateQuestion(id: number, feedback: FeedbackType | null): Observable<PrepQuestion> {
    return this.http.patch<PrepQuestion>(`/api/practice-questions/${id}/feedback`, { feedback });
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`/api/practice-questions/${id}`);
  }

  getCategories(): Observable<PracticeCategory[]> {
    return this.http.get<PracticeCategory[]>('/api/practice-categories');
  }

  createCategory(data: CreatePracticeCategoryPayload): Observable<PracticeCategory> {
    return this.http.post<PracticeCategory>('/api/practice-categories', data);
  }

  updateCategory(id: number, data: CreatePracticeCategoryPayload): Observable<PracticeCategory> {
    return this.http.put<PracticeCategory>(`/api/practice-categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`/api/practice-categories/${id}`);
  }

  evaluateAnswer(questionId: number, userAnswer: string, customPrompt?: string): Observable<{ feedback: string; verdict: string }> {
    return this.http.post<{ feedback: string; verdict: string }>(
      `/api/practice-questions/${questionId}/evaluate`,
      { userAnswer, customPrompt: customPrompt ?? null }
    );
  }

  getAttempts(): Observable<PracticeAttempt[]> {
    return this.http.get<PracticeAttempt[]>('/api/practice-attempts');
  }

  resetStatistics(): Observable<PrepQuestion[]> {
    return this.http.post<PrepQuestion[]>('/api/practice-questions/reset-statistics', {});
  }

  createAttempt(practiceQuestionId: number, userAnswer: string, feedback: FeedbackType): Observable<PracticeAttempt> {
    return this.http.post<PracticeAttempt>('/api/practice-attempts', { practiceQuestionId, userAnswer, feedback });
  }
}
