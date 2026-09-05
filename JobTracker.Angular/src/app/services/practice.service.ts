import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FeedbackType, PracticeAttempt, PracticeCategory, PrepQuestion } from '../models/practice.model';
import { CreatePracticeQuestionPayload, PracticeApiService, UpdatePracticeQuestionPayload } from './practice-api.service';

const PRACTICE_DATES_KEY = 'practice_dates';
const PRACTICE_BOOKMARKS_KEY = 'practice_bookmarks';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  readonly questions = signal<PrepQuestion[]>([]);
  readonly categories = signal<PracticeCategory[]>([]);
  readonly attempts = signal<PracticeAttempt[]>([]);
  readonly error = signal<string>('');

  readonly visibleCategories = computed(() => this.categories().filter(c => !c.isHidden));

  private readonly hiddenCategoryNames = computed(() =>
    new Set(this.categories().filter(c => c.isHidden).map(c => c.name))
  );

  // Everything the practice deck may serve: hidden questions and questions living in a
  // hidden category are never asked, so they stay out of the progress figures too.
  readonly askableQuestions = computed(() => {
    const hiddenCategories = this.hiddenCategoryNames();
    return this.questions().filter(q => !q.isHidden && !hiddenCategories.has(q.category));
  });

  private readonly _practiceDates = signal<string[]>(this._loadDates());
  private readonly _bookmarkedIds = signal<Set<number>>(this._loadBookmarks());

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
    const qs = this.askableQuestions();
    const total = qs.length;
    if (total === 0) return 0;
    const correct = qs.filter(q => q.feedback === 'correct').length;
    return Math.round((correct / total) * 100);
  });

  readonly answeredCount = computed(() =>
    this.askableQuestions().filter(q => q.feedback !== null).length
  );

  readonly loading = signal<boolean>(true);

  constructor(private readonly api: PracticeApiService) { }

  private _loadDates(): string[] {
    try { return JSON.parse(localStorage.getItem(PRACTICE_DATES_KEY) ?? '[]'); }
    catch { return []; }
  }

  private _loadBookmarks(): Set<number> {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(PRACTICE_BOOKMARKS_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((id): id is number => typeof id === 'number'));
    }
    catch { return new Set(); }
  }

  isBookmarked(questionId: number): boolean {
    return this._bookmarkedIds().has(questionId);
  }

  toggleBookmark(questionId: number): void {
    const updated = new Set(this._bookmarkedIds());
    if (updated.has(questionId)) { updated.delete(questionId); } else { updated.add(questionId); }
    localStorage.setItem(PRACTICE_BOOKMARKS_KEY, JSON.stringify([...updated]));
    this._bookmarkedIds.set(updated);
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
    this.loading.set(true);
    this.error.set('');

    const questions$ = this.api.getQuestions().pipe(
      tap(data => this.questions.set(data)),
      catchError(() => {
        this.error.set('Nem sikerült betölteni a gyakorló kérdéseket.');
        return of(null);
      })
    );
    const categories$ = this.api.getCategories().pipe(
      tap(data => this.categories.set(data)),
      catchError(() => {
        this.error.set('Nem sikerült betölteni a kérdés kategóriákat.');
        return of(null);
      })
    );
    const attempts$ = this.api.getAttempts().pipe(
      tap(data => this.attempts.set(data)),
      catchError(() => {
        this.error.set('Nem sikerült betölteni a gyakorlási naplót.');
        return of(null);
      })
    );

    forkJoin([questions$, categories$, attempts$]).subscribe(() => this.loading.set(false));
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
    const existing = this.categories().find(c => c.id === id);
    if (!existing) return;
    const oldName = existing.name;
    this.error.set('');
    this.api.updateCategory(id, { name: trimmed, color, isHidden: existing.isHidden }).subscribe({
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

  toggleCategoryHidden(id: number): void {
    const category = this.categories().find(c => c.id === id);
    if (!category) return;
    this.error.set('');
    this.api.updateCategory(id, { name: category.name, color: category.color, isHidden: !category.isHidden }).subscribe({
      next: updated => this.categories.update(prev => prev.map(c => c.id === id ? updated : c)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a kategóriát.')
    });
  }

  moveCategoryUp(id: number): void {
    const categories = [...this.categories()];
    const index = categories.findIndex(c => c.id === id);
    if (index <= 0) return;
    [categories[index - 1], categories[index]] = [categories[index], categories[index - 1]];
    this.saveCategoryOrder(categories);
  }

  moveCategoryDown(id: number): void {
    const categories = [...this.categories()];
    const index = categories.findIndex(c => c.id === id);
    if (index < 0 || index >= categories.length - 1) return;
    [categories[index], categories[index + 1]] = [categories[index + 1], categories[index]];
    this.saveCategoryOrder(categories);
  }

  moveCategoryToIndex(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    const categories = [...this.categories()];
    const [moved] = categories.splice(fromIndex, 1);
    categories.splice(toIndex, 0, moved);
    this.saveCategoryOrder(categories);
  }

  private saveCategoryOrder(categories: PracticeCategory[]): void {
    const reordered = categories.map((c, index) => ({ ...c, sortOrder: index }));
    this.categories.set(reordered);
    this.error.set('');
    this.api.reorderCategories(reordered.map(c => ({ id: c.id, sortOrder: c.sortOrder }))).subscribe({
      next: updated => this.categories.set(updated),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült menteni a kategóriák sorrendjét.')
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

  setQuestionsHidden(ids: Iterable<number>, isHidden: boolean): void {
    const selected = new Set(ids);
    const targets = this.questions().filter(q => selected.has(q.id) && q.isHidden !== isHidden);
    if (targets.length === 0) return;
    this.error.set('');
    forkJoin(targets.map(q => this.api.setQuestionHidden(q.id, isHidden))).subscribe({
      next: updated => {
        const byId = new Map(updated.map(q => [q.id, q]));
        this.questions.update(prev => prev.map(q => byId.get(q.id) ?? q));
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült módosítani a kérdések láthatóságát.')
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
