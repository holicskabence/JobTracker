import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackType, PracticeCategory, PrepQuestion } from '../models/practice.model';
import { CreatePracticeQuestionPayload, PracticeApiService } from './practice-api.service';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  readonly questions = signal<PrepQuestion[]>([]);
  readonly categories = signal<PracticeCategory[]>([]);
  readonly error = signal<string>('');

  constructor(private readonly api: PracticeApiService) { }

  loadAll(): void {
    this.error.set('');
    this.api.getQuestions().subscribe({
      next: data => this.questions.set(data),
      error: () => this.error.set('Nem sikerült betölteni a gyakorló kérdéseket.')
    });
    this.api.getCategories().subscribe({
      next: data => this.categories.set(data),
      error: () => this.error.set('Nem sikerült betölteni a kérdés kategóriákat.')
    });
  }

  addCategory(name: string, color: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (this.categories().some(c => c.name === trimmed)) return;
    this.error.set('');
    this.api.createCategory({ name: trimmed, color }).subscribe({
      next: created => this.categories.update(prev => [...prev, created]),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült létrehozni a kategóriát.')
    });
  }

  deleteCategory(id: number): void {
    if (this.categories().length <= 1) return;
    this.error.set('');
    this.api.deleteCategory(id).subscribe({
      next: () => this.categories.update(prev => prev.filter(c => c.id !== id)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült törölni a kategóriát.')
    });
  }

  addQuestion(data: CreatePracticeQuestionPayload): void {
    this.error.set('');
    this.api.createQuestion(data).subscribe({
      next: created => this.questions.update(prev => [...prev, created]),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült létrehozni a kérdést.')
    });
  }

  rate(id: number, feedback: FeedbackType): void {
    this.error.set('');
    this.api.rateQuestion(id, feedback).subscribe({
      next: updated => this.questions.update(prev => prev.map(q => q.id === id ? updated : q)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült menteni az értékelést.')
    });
  }

  deleteQuestion(id: number): void {
    this.error.set('');
    this.api.deleteQuestion(id).subscribe({
      next: () => this.questions.update(prev => prev.filter(q => q.id !== id)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült törölni a kérdést.')
    });
  }
}
