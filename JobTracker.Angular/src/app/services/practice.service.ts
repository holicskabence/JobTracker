import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackType, PracticeAttempt, PracticeCategory, PrepQuestion } from '../models/practice.model';
import { CreatePracticeQuestionPayload, PracticeApiService, UpdatePracticeQuestionPayload } from './practice-api.service';

const PRACTICE_DATES_KEY = 'practice_dates';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  readonly questions = signal<PrepQuestion[]>([]);
  readonly categories = signal<PracticeCategory[]>([]);
  readonly attempts = signal<PracticeAttempt[]>([]);
  readonly error = signal<string>('');

  private readonly _practiceDates = signal<string[]>(this._loadDates());

  readonly practiceStreak = computed(() => {
    const dates = new Set(this._practiceDates());
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (dates.has(key)) { count++; }
      else if (i > 0) { break; }
    }
    return count;
  });

  readonly lastPracticedDaysAgo = computed((): number | null => {
    const dates = this._practiceDates();
    if (!dates.length) return null;
    const latest = [...dates].sort().at(-1)!;
    const last = new Date(latest); last.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((today.getTime() - last.getTime()) / 86_400_000);
  });

  readonly readinessScore = computed(() => {
    const qs = this.questions();
    const total = qs.length;
    if (total === 0) return 0;
    const correct = qs.filter(q => q.feedback === 'correct').length;
    return Math.round((correct / total) * 100);
  });

  readonly answeredCount = computed(() =>
    this.questions().filter(q => q.feedback !== null).length
  );

  constructor(private readonly api: PracticeApiService) { }

  private _loadDates(): string[] {
    try { return JSON.parse(localStorage.getItem(PRACTICE_DATES_KEY) ?? '[]'); }
    catch { return []; }
  }

  private _saveToday(): void {
    const today = new Date().toISOString().split('T')[0];
    const dates = this._practiceDates();
    if (dates.includes(today)) return;
    const updated = [...dates, today];
    localStorage.setItem(PRACTICE_DATES_KEY, JSON.stringify(updated));
    this._practiceDates.set(updated);
  }

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
    this.api.getAttempts().subscribe({
      next: data => this.attempts.set(data),
      error: () => this.error.set('Nem sikerült betölteni a gyakorlási naplót.')
    });
  }

  addCategory(name: string, color: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (this.categories().some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    this.error.set('');
    this.api.createCategory({ name: trimmed, color }).subscribe({
      next: created => this.categories.update(prev => [...prev, created]),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült létrehozni a kategóriát.')
    });
  }

  updateCategory(id: number, name: string, color: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const oldName = this.categories().find(c => c.id === id)?.name;
    this.error.set('');
    this.api.updateCategory(id, { name: trimmed, color }).subscribe({
      next: updated => {
        this.categories.update(prev => prev.map(c => c.id === id ? updated : c));
        if (oldName && oldName !== trimmed) {
          this.questions.update(prev => prev.map(q => q.category === oldName ? { ...q, category: trimmed } : q));
        }
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a kategóriát.')
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

  addQuestions(data: CreatePracticeQuestionPayload[], onDone?: (createdCount: number | null) => void): void {
    this.error.set('');
    this.api.createQuestions(data).subscribe({
      next: created => {
        this.questions.update(prev => [...prev, ...created]);
        onDone?.(created.length);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message ?? 'Nem sikerült importálni a kérdéseket.');
        onDone?.(null);
      }
    });
  }

  updateQuestion(id: number, data: UpdatePracticeQuestionPayload): void {
    this.error.set('');
    this.api.updateQuestion(id, data).subscribe({
      next: updated => this.questions.update(prev => prev.map(q => q.id === id ? updated : q)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a kérdést.')
    });
  }

  rate(id: number, feedback: FeedbackType, userAnswer: string): void {
    this.error.set('');
    this._saveToday();
    this.api.rateQuestion(id, feedback).subscribe({
      next: updated => this.questions.update(prev => prev.map(q => q.id === id ? updated : q)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült menteni az értékelést.')
    });
    this.api.createAttempt(id, userAnswer, feedback).subscribe({
      next: attempt => this.attempts.update(prev => [attempt, ...prev]),
      error: () => this.error.set('Nem sikerült rögzíteni a naplóbejegyzést.')
    });
  }

  resetStatistics(): void {
    this.error.set('');
    this.api.resetStatistics().subscribe({
      next: questions => {
        this.questions.set(questions);
        this.attempts.set([]);
        localStorage.removeItem(PRACTICE_DATES_KEY);
        this._practiceDates.set([]);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült alaphelyzetbe állítani a statisztikát.')
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
