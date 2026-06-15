import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PracticeService } from '../../services/practice.service';
import { PracticeApiService } from '../../services/practice-api.service';
import { AuthService } from '../../services/auth.service';
import { FeedbackType, PracticeAttempt, PrepQuestion, QuestionCategory } from '../../models/practice.model';
import { CardComponent } from '../shared/card/card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';

type Tab = 'practice' | 'questions' | 'results';
type FilterCategory = 'Mind' | QuestionCategory;
type FeedbackFilter = 'failed' | 'unanswered';
type ActiveFilter = FilterCategory | FeedbackFilter;
type QSortKey = 'category' | 'question' | 'feedback';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [FormsModule, CardComponent, EmptyStateComponent, PageHeaderComponent],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css'
})
export class PracticeComponent {
  readonly practice = inject(PracticeService);
  private readonly api = inject(PracticeApiService);
  private readonly auth = inject(AuthService);

  // ── Tab navigation ──────────────────────────────────────────────────────────
  readonly activeTab = signal<Tab>('practice');

  // ── Practice tab: filters ───────────────────────────────────────────────────
  readonly categories = computed<FilterCategory[]>(() =>
    ['Mind', ...this.practice.categories().map(c => c.name)]
  );
  readonly selectedFilter = signal<ActiveFilter>('Mind');
  readonly currentIdx = signal(0);
  readonly userAnswer = signal('');
  readonly showSample = signal(false);

  readonly filteredQuestions = computed<PrepQuestion[]>(() => {
    const filter = this.selectedFilter();
    let list = this.practice.questions();
    if (filter === 'failed') {
      list = list.filter(q => q.feedback === 'incorrect');
    } else if (filter === 'unanswered') {
      list = list.filter(q => q.feedback === null);
    } else if (filter !== 'Mind') {
      list = list.filter(q => q.category === filter);
    }
    return list;
  });

  readonly currentQuestion = computed<PrepQuestion | null>(() =>
    this.filteredQuestions()[this.currentIdx()] ?? null
  );

  readonly answeredCount = computed(() =>
    this.filteredQuestions().filter(q => q.feedback !== null).length
  );

  readonly ratingBreakdown = computed(() => {
    const list = this.filteredQuestions();
    return {
      correct: list.filter(q => q.feedback === 'correct').length,
      incorrect: list.filter(q => q.feedback === 'incorrect').length,
      total: list.length
    };
  });

  readonly readinessScore = computed(() => {
    const { correct, total } = this.ratingBreakdown();
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  });

  readonly answerRatio = computed(() => {
    const { correct, incorrect } = this.ratingBreakdown();
    const answered = correct + incorrect;
    if (answered === 0) return { correctPct: 0, incorrectPct: 0, answered: 0 };
    const correctPct = Math.round((correct / answered) * 100);
    return { correctPct, incorrectPct: 100 - correctPct, answered };
  });

  readonly useAiEvaluation = computed(() => this.auth.currentUser()?.useAiEvaluation ?? false);

  readonly aiLoading = signal(false);
  readonly aiFeedback = signal<string | null>(null);
  readonly aiTypedText = signal('');
  readonly aiVerdict = signal<'correct' | 'incorrect' | null>(null);
  readonly aiError = signal<string | null>(null);
  readonly aiDone = signal(false);

  readonly showResetConfirm = signal(false);

  readonly showQuestionModal = signal(false);
  readonly editingQuestionId = signal<number | null>(null);
  readonly formCat = signal('');
  readonly formQuestion = signal('');
  readonly formHint = signal('');
  readonly formSampleAnswer = signal('');
  readonly formError = signal('');

  // ── Questions tab: search & sort ────────────────────────────────────────────
  readonly qSearch = signal('');
  readonly qSortKey = signal<QSortKey>('category');
  readonly qSortDir = signal<'asc' | 'desc'>('asc');

  readonly sortedQuestions = computed<PrepQuestion[]>(() => {
    const term = this.qSearch().trim().toLowerCase();
    const key = this.qSortKey();
    const dir = this.qSortDir() === 'asc' ? 1 : -1;

    let list = this.practice.questions();
    if (term) {
      list = list.filter(q =>
        q.question.toLowerCase().includes(term) ||
        q.hint.toLowerCase().includes(term) ||
        q.category.toLowerCase().includes(term)
      );
    }

    return [...list].sort((a, b) => {
      const va = key === 'feedback' ? (a.feedback ?? '') : a[key];
      const vb = key === 'feedback' ? (b.feedback ?? '') : b[key];
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  });

  // ── Results tab ─────────────────────────────────────────────────────────────
  readonly expandedResultId = signal<number | null>(null);

  readonly resultsSummary = computed(() => {
    const qs = this.practice.questions();
    return {
      correct: qs.filter(q => q.feedback === 'correct').length,
      incorrect: qs.filter(q => q.feedback === 'incorrect').length,
      unanswered: qs.filter(q => q.feedback === null).length,
      total: qs.length,
      score: qs.length ? Math.round((qs.filter(q => q.feedback === 'correct').length / qs.length) * 100) : 0
    };
  });

  readonly attemptGroups = computed(() => {
    const groups = new Map<string, PracticeAttempt[]>();
    for (const a of this.practice.attempts()) {
      const key = this.dateKey(a.createdAt);
      const list = groups.get(key);
      if (list) { list.push(a); } else { groups.set(key, [a]); }
    }
    return [...groups.entries()].map(([date, attempts]) => ({
      date,
      label: this.formatDateLabel(date),
      attempts
    }));
  });

  selectFilter(filter: ActiveFilter): void {
    this.selectedFilter.set(filter);
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
  }

  revealSample(): void {
    if (!this.userAnswer().trim()) return;
    if (this.useAiEvaluation()) {
      this.requestAiEvaluation();
    } else {
      this.showSample.set(true);
    }
  }

  private requestAiEvaluation(): void {
    const q = this.currentQuestion();
    if (!q) return;
    this.aiLoading.set(true);
    this.aiFeedback.set(null);
    this.aiTypedText.set('');
    this.aiVerdict.set(null);
    this.aiError.set(null);
    this.aiDone.set(false);
    this.showSample.set(true);

    this.api.evaluateAnswer(q.id, this.userAnswer()).subscribe({
      next: res => {
        this.aiLoading.set(false);
        this.aiFeedback.set(res.feedback);
        this.aiVerdict.set(res.verdict as 'correct' | 'incorrect');
        this.startTypewriter(res.feedback);
      },
      error: () => {
        this.aiLoading.set(false);
        this.aiError.set('Az AI értékelés sikertelen volt. Kérlek próbáld újra.');
      }
    });
  }

  private startTypewriter(text: string): void {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      this.aiTypedText.set(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); this.aiDone.set(true); }
    }, 16);
  }

  private resetAi(): void {
    this.aiLoading.set(false);
    this.aiFeedback.set(null);
    this.aiTypedText.set('');
    this.aiVerdict.set(null);
    this.aiError.set(null);
    this.aiDone.set(false);
  }

  proceedWithAiVerdict(): void {
    const v = this.aiVerdict();
    this.rate(v === 'correct' ? 'correct' : 'incorrect');
  }

  rate(type: FeedbackType): void {
    const q = this.currentQuestion();
    if (!q) return;
    this.practice.rate(q.id, type, this.userAnswer().trim());
    setTimeout(() => this.next(), 350);
  }

  next(): void {
    if (this.currentIdx() >= this.filteredQuestions().length - 1) return;
    this.currentIdx.update(i => i + 1);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
  }

  prev(): void {
    if (this.currentIdx() <= 0) return;
    this.currentIdx.update(i => i - 1);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
  }

  goToIndex(idx: number): void {
    if (idx < 0 || idx >= this.filteredQuestions().length || idx === this.currentIdx()) return;
    this.currentIdx.set(idx);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
  }

  openAddQuestionModal(): void {
    this.editingQuestionId.set(null);
    this.formCat.set(this.practice.categories()[0]?.name ?? '');
    this.formQuestion.set('');
    this.formHint.set('');
    this.formSampleAnswer.set('');
    this.formError.set('');
    this.showQuestionModal.set(true);
  }

  openEditQuestionModal(q: PrepQuestion): void {
    this.editingQuestionId.set(q.id);
    this.formCat.set(q.category);
    this.formQuestion.set(q.question);
    this.formHint.set(q.hint);
    this.formSampleAnswer.set(q.sampleAnswer);
    this.formError.set('');
    this.showQuestionModal.set(true);
  }

  closeQuestionModal(): void { this.showQuestionModal.set(false); }

  submitQuestion(): void {
    const cat = this.formCat().trim();
    const q = this.formQuestion().trim();
    const h = this.formHint().trim();
    const sa = this.formSampleAnswer().trim();
    if (!cat) { this.formError.set('Válassz kategóriát.'); return; }
    if (!q) { this.formError.set('A kérdés szövege kötelező.'); return; }
    if (!sa) { this.formError.set('A mintaválasz kötelező.'); return; }
    this.formError.set('');

    const editingId = this.editingQuestionId();
    if (editingId !== null) {
      this.practice.updateQuestion(editingId, { category: cat, question: q, hint: h, sampleAnswer: sa });
    } else {
      this.practice.addQuestion({ category: cat, question: q, hint: h, sampleAnswer: sa });
    }
    this.showQuestionModal.set(false);
  }

  deleteQuestion(id: number): void { this.practice.deleteQuestion(id); }

  openResetConfirm(): void { this.showResetConfirm.set(true); }
  closeResetConfirm(): void { this.showResetConfirm.set(false); }

  confirmResetStatistics(): void {
    this.practice.resetStatistics();
    this.showResetConfirm.set(false);
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
  }

  // ── Category dropdown (modal) ───────────────────────────────────────────────
  catDropOpen = false;
  catDropTop = 0;
  catDropLeft = 0;
  catDropWidth = 0;

  toggleCatDrop(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.catDropOpen) {
      const btn = event.currentTarget as HTMLElement;
      const r = btn.getBoundingClientRect();
      const estimatedH = this.practice.categories().length * 40 + 10;
      this.catDropLeft = r.left;
      this.catDropWidth = Math.max(r.width, 192);
      if (this.catDropLeft + this.catDropWidth > window.innerWidth - 8) {
        this.catDropLeft = window.innerWidth - this.catDropWidth - 8;
      }
      this.catDropTop = (window.innerHeight - r.bottom - 8 >= estimatedH || r.top < estimatedH)
        ? r.bottom + 4
        : r.top - estimatedH - 4;
    }
    this.catDropOpen = !this.catDropOpen;
  }

  pickCategory(name: string, event: MouseEvent): void {
    event.stopPropagation();
    this.formCat.set(name);
    this.catDropOpen = false;
  }

  @HostListener('document:click')
  closeCatDrop(): void { this.catDropOpen = false; }

  qSort(key: QSortKey): void {
    if (this.qSortKey() === key) {
      this.qSortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.qSortKey.set(key);
      this.qSortDir.set('asc');
    }
  }

  qSortIcon(key: QSortKey): string {
    if (this.qSortKey() !== key) return '↕';
    return this.qSortDir() === 'asc' ? '↑' : '↓';
  }

  toggleResultExpand(id: number): void {
    this.expandedResultId.update(cur => cur === id ? null : id);
  }

  getFeedback(id: number): FeedbackType | null {
    return this.practice.questions().find(q => q.id === id)?.feedback ?? null;
  }

  feedbackLabel(fb: FeedbackType | null): string {
    if (fb === 'correct') return 'HELYES';
    if (fb === 'incorrect') return 'HELYTELEN';
    return '';
  }

  getReadinessColor(): string {
    const score = this.readinessScore();
    if (score >= 80) return '#26ac00';
    if (score >= 60) return '#5fb9fa';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getReadinessLabel(): string {
    const score = this.readinessScore();
    if (score >= 80) return 'Kiváló';
    if (score >= 60) return 'Jó';
    if (score >= 40) return 'Fejleszthető';
    return 'Kezdő';
  }

  categoryColor(cat: QuestionCategory): string {
    return this.practice.categories().find(c => c.name === cat)?.color ?? '#9b9b99';
  }

  trackByCategory(_: number, cat: FilterCategory): string { return cat; }
  trackByQuestion(_: number, q: PrepQuestion): number { return q.id; }

  private dateKey(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private formatDateLabel(dateKey: string): string {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return 'Tegnap';
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatAttemptTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }
}
