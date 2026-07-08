import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PracticeService } from '../../services/practice.service';
import { CreatePracticeQuestionPayload, PracticeApiService } from '../../services/practice-api.service';
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
  imports: [FormsModule, CardComponent, EmptyStateComponent, PageHeaderComponent, TranslateModule],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css'
})
export class PracticeComponent {
  readonly practice = inject(PracticeService);
  private readonly api = inject(PracticeApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  // ── Tab navigation ──────────────────────────────────────────────────────────
  readonly activeTab = signal<Tab>('practice');

  // ── Practice tab: filters ───────────────────────────────────────────────────
  readonly selectedFilter = signal<ActiveFilter>('Mind');
  readonly categorySearch = signal('');

  readonly showCategorySearch = computed(() => this.practice.categories().length > 6);

  readonly visibleCategories = computed(() => {
    const term = this.categorySearch().trim().toLowerCase();
    const cats = this.practice.categories();
    if (!term) return cats;
    return cats.filter(c => c.name.toLowerCase().includes(term));
  });

  private readonly categoryCounts = computed(() => {
    const map = new Map<string, number>();
    for (const q of this.practice.questions()) {
      map.set(q.category, (map.get(q.category) ?? 0) + 1);
    }
    return map;
  });

  readonly failedCount = computed(() => this.practice.questions().filter(q => q.feedback === 'incorrect').length);
  readonly unansweredCount = computed(() => this.practice.questions().filter(q => q.feedback === null).length);
  readonly currentIdx = signal(0);
  readonly userAnswer = signal('');
  readonly showSample = signal(false);
  readonly dontKnowMode = signal(false);
  readonly randomOrder = signal(false);
  private readonly randomOrderIds = signal<number[]>([]);
  private readonly idxDraft = signal<string | null>(null);

  private readonly naturalFilteredQuestions = computed<PrepQuestion[]>(() => {
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

  readonly filteredQuestions = computed<PrepQuestion[]>(() => {
    const list = this.naturalFilteredQuestions();
    if (!this.randomOrder()) return list;

    const byId = new Map(list.map(q => [q.id, q]));
    const ordered: PrepQuestion[] = [];
    for (const id of this.randomOrderIds()) {
      const q = byId.get(id);
      if (q) { ordered.push(q); byId.delete(id); }
    }
    ordered.push(...byId.values());
    return ordered;
  });

  readonly currentQuestion = computed<PrepQuestion | null>(() =>
    this.filteredQuestions()[this.currentIdx()] ?? null
  );

  readonly idxDisplayValue = computed(() => this.idxDraft() ?? String(this.currentIdx() + 1));

  // ── Practice tab: jump-to-question search ───────────────────────────────────
  readonly jumpSearch = signal('');
  readonly jumpDropOpen = signal(false);

  readonly jumpResults = computed(() => {
    const term = this.jumpSearch().trim().toLowerCase();
    if (!term) return [];
    return this.filteredQuestions()
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => q.question.toLowerCase().includes(term) || q.category.toLowerCase().includes(term))
      .slice(0, 8);
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

  // ── Questions tab: bulk JSON import ─────────────────────────────────────────
  readonly importing = signal(false);
  readonly importError = signal('');
  readonly importSuccess = signal('');

  // ── Questions tab: search & sort ────────────────────────────────────────────
  readonly qSearch = signal('');
  readonly qSortKey = signal<QSortKey>('category');
  readonly qSortDir = signal<'asc' | 'description'>('asc');

  // ── Questions tab: multi-select & bulk delete ───────────────────────────────
  readonly selectedQuestionIds = signal<Set<number>>(new Set());
  readonly showBulkDeleteConfirm = signal(false);
  readonly selectedQuestionCount = computed(() => this.selectedQuestionIds().size);
  readonly isAllQuestionsSelected = computed(() => {
    const list = this.sortedQuestions();
    return list.length > 0 && list.every(q => this.selectedQuestionIds().has(q.id));
  });

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

  readonly recentAttempts = computed(() => this.practice.attempts().slice(0, 5));

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
    this.dontKnowMode.set(false);
    this.resetAi();
    if (this.randomOrder()) this.reshuffle();
  }

  toggleRandomOrder(): void {
    this.randomOrder.update(v => !v);
    if (this.randomOrder()) {
      this.reshuffle();
    } else {
      this.currentIdx.set(0);
      this.userAnswer.set('');
      this.showSample.set(false);
      this.dontKnowMode.set(false);
      this.resetAi();
    }
  }

  reshuffle(): void {
    const ids = this.naturalFilteredQuestions().map(q => q.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    this.randomOrderIds.set(ids);
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.dontKnowMode.set(false);
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

  revealAnswerDirectly(): void {
    this.dontKnowMode.set(true);
    this.showSample.set(true);
  }

  hideAnswer(): void {
    this.showSample.set(false);
    this.dontKnowMode.set(false);
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
      next: result => {
        this.aiLoading.set(false);
        this.aiFeedback.set(result.feedback);
        this.aiVerdict.set(result.verdict as 'correct' | 'incorrect');
        this.startTypewriter(result.feedback);
      },
      error: () => {
        this.aiLoading.set(false);
        this.aiError.set(this.translate.instant('practice.errors.aiEvaluationFailed'));
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
    this.dontKnowMode.set(false);
    this.resetAi();
  }

  prev(): void {
    if (this.currentIdx() <= 0) return;
    this.currentIdx.update(i => i - 1);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.dontKnowMode.set(false);
    this.resetAi();
  }

  goToIndex(index: number): void {
    if (index < 0 || index >= this.filteredQuestions().length || index === this.currentIdx()) return;
    this.currentIdx.set(index);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.dontKnowMode.set(false);
    this.resetAi();
  }

  onIdxInputChange(value: string): void {
    this.idxDraft.set(value);
  }

  confirmIdxInput(): void {
    const draft = this.idxDraft();
    if (draft !== null) {
      const n = Math.trunc(Number(draft));
      const total = this.filteredQuestions().length;
      if (Number.isFinite(n) && n >= 1 && n <= total) {
        this.goToIndex(n - 1);
      }
    }
    this.idxDraft.set(null);
  }

  onJumpSearchChange(value: string): void {
    this.jumpSearch.set(value);
    this.jumpDropOpen.set(true);
  }

  onJumpFocus(): void {
    if (this.jumpSearch().trim()) this.jumpDropOpen.set(true);
  }

  clearJumpSearch(): void {
    this.jumpSearch.set('');
    this.jumpDropOpen.set(false);
  }

  jumpToQuestion(index: number): void {
    this.goToIndex(index);
    this.jumpSearch.set('');
    this.jumpDropOpen.set(false);
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
    const category = this.formCat().trim();
    const q = this.formQuestion().trim();
    const h = this.formHint().trim();
    const sa = this.formSampleAnswer().trim();
    if (!category) { this.formError.set(this.translate.instant('practice.errors.categoryRequired')); return; }
    if (!q) { this.formError.set(this.translate.instant('practice.errors.questionRequired')); return; }
    if (!sa) { this.formError.set(this.translate.instant('practice.errors.sampleAnswerRequired')); return; }
    this.formError.set('');

    const editingId = this.editingQuestionId();
    if (editingId !== null) {
      this.practice.updateQuestion(editingId, { category: category, question: q, hint: h, sampleAnswer: sa });
    } else {
      this.practice.addQuestion({ category: category, question: q, hint: h, sampleAnswer: sa });
    }
    this.showQuestionModal.set(false);
  }

  deleteQuestion(id: number): void { this.practice.deleteQuestion(id); }

  triggerImportFile(input: HTMLInputElement): void {
    this.importError.set('');
    this.importSuccess.set('');
    input.click();
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.importError.set('');
    this.importSuccess.set('');
    this.importing.set(true);

    try {
      const items = this.parseImportJson(await file.text());
      const existingNames = new Set(this.practice.categories().map(c => c.name));
      const newCategoryNames = [...new Set(items.map(i => i.category))].filter(name => !existingNames.has(name));
      for (const name of newCategoryNames) {
        this.practice.addCategory(name, this.randomCategoryColor());
      }

      this.practice.addQuestions(items, createdCount => {
        this.importing.set(false);
        if (createdCount !== null) {
          this.importSuccess.set(`${createdCount} ${this.translate.instant('practice.import.successSuffix')}`);
        }
      });
    } catch (err) {
      this.importing.set(false);
      this.importError.set(err instanceof Error ? err.message : this.translate.instant('practice.errors.invalidJsonFile'));
    }
  }

  private parseImportJson(text: string): CreatePracticeQuestionPayload[] {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(this.translate.instant('practice.errors.fileNotValidJson'));
    }
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error(this.translate.instant('practice.errors.jsonMustBeNonEmptyArray'));
    }

    return raw.map((item, index) => {
      const o = item as Record<string, unknown>;
      const category = String(o?.['category'] ?? '').trim();
      const question = String(o?.['question'] ?? '').trim();
      const hint = String(o?.['hint'] ?? '').trim();
      const sampleAnswer = String(o?.['sampleAnswer'] ?? '').trim();
      if (!category || !question || !sampleAnswer) {
        throw new Error(`${this.translate.instant('practice.errors.importItemMissingFieldsPrefix')} ${index + 1}${this.translate.instant('practice.errors.importItemMissingFieldsSuffix')}`);
      }
      return { category, question, hint, sampleAnswer };
    });
  }

  private randomCategoryColor(): string {
    const palette = ['#5fb9fa', '#26ac00', '#f59e0b', '#ef4444', '#9b59b6', '#06b6d4', '#ec4899'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  isQuestionSelected(id: number): boolean {
    return this.selectedQuestionIds().has(id);
  }

  toggleQuestionSelection(id: number): void {
    this.selectedQuestionIds.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  toggleSelectAllQuestions(): void {
    if (this.isAllQuestionsSelected()) {
      this.selectedQuestionIds.set(new Set());
    } else {
      this.selectedQuestionIds.set(new Set(this.sortedQuestions().map(q => q.id)));
    }
  }

  clearQuestionSelection(): void { this.selectedQuestionIds.set(new Set()); }

  openBulkDeleteConfirm(): void {
    if (this.selectedQuestionCount() === 0) return;
    this.showBulkDeleteConfirm.set(true);
  }

  closeBulkDeleteConfirm(): void { this.showBulkDeleteConfirm.set(false); }

  confirmBulkDeleteQuestions(): void {
    for (const id of this.selectedQuestionIds()) {
      this.practice.deleteQuestion(id);
    }
    this.clearQuestionSelection();
    this.showBulkDeleteConfirm.set(false);
  }

  openResetConfirm(): void { this.showResetConfirm.set(true); }
  closeResetConfirm(): void { this.showResetConfirm.set(false); }

  confirmResetStatistics(): void {
    this.practice.resetStatistics();
    this.showResetConfirm.set(false);
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.dontKnowMode.set(false);
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
      const button = event.currentTarget as HTMLElement;
      const r = button.getBoundingClientRect();
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
  closeCatDrop(): void {
    this.catDropOpen = false;
    this.jumpDropOpen.set(false);
  }

  qSort(key: QSortKey): void {
    if (this.qSortKey() === key) {
      this.qSortDir.update(d => d === 'asc' ? 'description' : 'asc');
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

  feedbackLabel(feedback: FeedbackType | null): string {
    if (feedback === 'correct') return this.translate.instant('practice.feedbackLabel.correct');
    if (feedback === 'incorrect') return this.translate.instant('practice.feedbackLabel.incorrect');
    return '';
  }

  categoryColor(category: QuestionCategory): string {
    return this.practice.categories().find(c => c.name === category)?.color ?? '#9b9b99';
  }

  categoryCount(name: string): number {
    return this.categoryCounts().get(name) ?? 0;
  }

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
    if (diffDays === 0) return this.translate.instant('practice.dateLabel.today');
    if (diffDays === 1) return this.translate.instant('practice.dateLabel.yesterday');
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatAttemptTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }
}
