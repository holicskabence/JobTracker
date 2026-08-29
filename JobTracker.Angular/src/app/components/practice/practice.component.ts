import { Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PracticeService } from '../../services/practice.service';
import { CreatePracticeQuestionPayload, PracticeApiService } from '../../services/practice-api.service';
import { AuthService } from '../../services/auth.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { FeedbackType, PracticeAttempt, PrepQuestion, QuestionCategory } from '../../models/practice.model';
import { CardComponent } from '../shared/card/card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { SearchToolbarComponent } from '../shared/search-toolbar/search-toolbar.component';
import { SortableHeaderCellComponent } from '../shared/sortable-header-cell/sortable-header-cell.component';
import { DataTableComponent } from '../shared/data-table/data-table.component';

type Tab = 'practice' | 'questions' | 'results';
type FeedbackFilter = 'failed' | 'unanswered';
type QSortKey = 'category' | 'question' | 'feedback';
type AnswerFormat = 'bold' | 'italic' | 'bulletList' | 'numberedList' | 'code' | 'link';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [FormsModule, CardComponent, EmptyStateComponent, PageSectionComponent, TranslateModule, SearchToolbarComponent, SortableHeaderCellComponent, DataTableComponent],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css'
})
export class PracticeComponent {
  readonly practice = inject(PracticeService);
  private readonly api = inject(PracticeApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly breakpoints = inject(BreakpointService);
  // Same breakpoint the stylesheet uses to stack the aside above the deck.
  readonly isCompactAside = this.breakpoints.watch('(max-width: 1200px)');

  // ── Tab navigation ──────────────────────────────────────────────────────────
  readonly activeTab = signal<Tab>('practice');

  // ── Practice tab: filters ───────────────────────────────────────────────────
  // At most one built-in status filter (Mind/Failed/Unanswered) and at most one
  // master-data category can be active at the same time; they combine with AND.
  readonly selectedCategory = signal<string | null>(null);
  readonly selectedStatus = signal<FeedbackFilter | null>(null);
  readonly hasActiveFilters = computed(() => this.selectedCategory() !== null || this.selectedStatus() !== null);
  // The aside has a single search box; it feeds both halves of the result panel.
  readonly categoryResults = computed(() => {
    const term = this.jumpSearch().trim().toLowerCase();
    if (!term) return [];
    return this.practice.categories()
      .filter(c => c.name.toLowerCase().includes(term))
      .slice(0, 5);
  });

  readonly failedCount = computed(() => {
    const category = this.selectedCategory();
    let list = this.practice.questions().filter(q => q.feedback === 'incorrect');
    if (category !== null) list = list.filter(q => q.category === category);
    return list.length;
  });

  readonly unansweredCount = computed(() => {
    const category = this.selectedCategory();
    let list = this.practice.questions().filter(q => q.feedback === null);
    if (category !== null) list = list.filter(q => q.category === category);
    return list.length;
  });

  readonly emptyStateMessage = computed(() => {
    const status = this.selectedStatus();
    if (status === 'failed') return this.translate.instant('practice.empty.noFailed');
    if (status === 'unanswered') return this.translate.instant('practice.empty.noUnanswered');
    return this.translate.instant('practice.empty.noCategory');
  });

  readonly currentIdx = signal(0);
  readonly userAnswer = signal('');
  readonly answerMaxLength = 5000;
  private readonly answerInput = viewChild<ElementRef<HTMLTextAreaElement>>('answerInput');
  readonly hintOpen = signal(false);
  readonly showSample = signal(false);
  readonly dontKnowMode = signal(false);
  readonly randomOrder = signal(false);
  private readonly randomOrderIds = signal<number[]>([]);
  private readonly idxDraft = signal<string | null>(null);

  private readonly naturalFilteredQuestions = computed<PrepQuestion[]>(() => {
    const status = this.selectedStatus();
    const category = this.selectedCategory();
    let list = this.practice.questions();
    if (status === 'failed') {
      list = list.filter(q => q.feedback === 'incorrect');
    } else if (status === 'unanswered') {
      list = list.filter(q => q.feedback === null);
    }
    if (category !== null) {
      list = list.filter(q => q.category === category);
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

  readonly deckProgress = computed(() => {
    const total = this.filteredQuestions().length;
    if (total === 0) return 0;
    return ((this.currentIdx() + 1) / total) * 100;
  });

  // ── Practice tab: category list (collapsed until "show more") ────────────────
  private readonly collapsedCategoryCount = 10;
  readonly categoriesExpanded = signal(false);
  private readonly categoryList = viewChild<ElementRef<HTMLElement>>('categoryList');
  // Expanding must never resize the aside: the list is frozen at the height it had
  // while collapsed, so the extra categories scroll inside that same box.
  readonly categoryListLockedHeight = signal<number | null>(null);
  // On mobile the whole panel sits above the deck, so it starts folded away.
  readonly categoriesPanelOpen = signal(false);

  readonly visibleCategories = computed(() => {
    const list = this.practice.categories();
    // The compact panel is a scroll box, so it always carries the full list.
    if (this.isCompactAside()) return list;
    return this.categoriesExpanded() ? list : list.slice(0, this.collapsedCategoryCount);
  });

  readonly hasHiddenCategories = computed(() =>
    !this.isCompactAside() && this.practice.categories().length > this.collapsedCategoryCount
  );

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

  toggleStatusFilter(status: FeedbackFilter): void {
    this.selectedStatus.update(prev => prev === status ? null : status);
    this.onFilterChanged();
  }

  toggleCategoryFilter(name: string): void {
    this.selectedCategory.update(prev => prev === name ? null : name);
    this.onFilterChanged();
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.selectedStatus.set(null);
    this.onFilterChanged();
  }

  private onFilterChanged(): void {
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.hintOpen.set(false);
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
      this.hintOpen.set(false);
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
    this.hintOpen.set(false);
    this.showSample.set(false);
    this.dontKnowMode.set(false);
    this.resetAi();
  }

  toggleHint(): void {
    this.hintOpen.update(open => !open);
  }

  revealSample(): void {
    // The button stays enabled so the action row never reads as unavailable; an empty
    // answer just sends the caret back to the editor instead of burning an evaluation.
    if (!this.userAnswer().trim()) {
      this.answerInput()?.nativeElement.focus();
      return;
    }
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
    this.hintOpen.set(false);
    this.showSample.set(false);
    this.dontKnowMode.set(false);
    this.resetAi();
  }

  prev(): void {
    if (this.currentIdx() <= 0) return;
    this.currentIdx.update(i => i - 1);
    this.userAnswer.set('');
    this.hintOpen.set(false);
    this.showSample.set(false);
    this.dontKnowMode.set(false);
    this.resetAi();
  }

  goToIndex(index: number): void {
    if (index < 0 || index >= this.filteredQuestions().length || index === this.currentIdx()) return;
    this.currentIdx.set(index);
    this.userAnswer.set('');
    this.hintOpen.set(false);
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

  selectCategoryFromSearch(name: string): void {
    this.selectedCategory.set(name);
    this.onFilterChanged();
    this.clearJumpSearch();
  }

  jumpToQuestion(index: number): void {
    this.goToIndex(index);
    this.jumpSearch.set('');
    this.jumpDropOpen.set(false);
  }

  toggleCategoriesExpanded(): void {
    if (this.categoriesExpanded()) {
      this.categoryListLockedHeight.set(null);
    } else {
      const element = this.categoryList()?.nativeElement;
      this.categoryListLockedHeight.set(element ? Math.round(element.getBoundingClientRect().height) : null);
    }
    this.categoriesExpanded.update(expanded => !expanded);
  }

  toggleCategoriesPanel(): void {
    this.categoriesPanelOpen.update(open => !open);
  }

  isBookmarked(questionId: number): boolean {
    return this.practice.isBookmarked(questionId);
  }

  toggleBookmark(questionId: number): void {
    this.practice.toggleBookmark(questionId);
  }

  // ── Practice tab: markdown shortcuts for the answer editor ──────────────────
  applyAnswerFormat(format: AnswerFormat): void {
    const textarea = this.answerInput()?.nativeElement;
    if (!textarea) return;

    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    if (format === 'bulletList' || format === 'numberedList') {
      const blockStart = value.lastIndexOf('\n', start - 1) + 1;
      const blockEnd = this.lineEndIndex(value, end);
      const listed = value.slice(blockStart, blockEnd)
        .split('\n')
        .map((line, index) => (format === 'bulletList' ? '- ' : `${index + 1}. `) + line)
        .join('\n');
      this.replaceAnswerRange(textarea, blockStart, blockEnd, listed, listed.length);
      return;
    }

    if (format === 'link') {
      const label = selected || this.translate.instant('practice.card.linkTextPlaceholder');
      const snippet = `[${label}](https://)`;
      // Caret lands just inside the closing paren so the URL can be typed straight away.
      this.replaceAnswerRange(textarea, start, end, snippet, snippet.length - 1);
      return;
    }

    if (format === 'code' && selected.includes('\n')) {
      const fence = '```';
      const snippet = `${fence}\n${selected}\n${fence}`;
      this.replaceAnswerRange(textarea, start, end, snippet, snippet.length);
      return;
    }

    const wrapper = format === 'bold' ? '**' : format === 'italic' ? '*' : '`';
    const snippet = `${wrapper}${selected}${wrapper}`;
    this.replaceAnswerRange(textarea, start, end, snippet, selected ? snippet.length : wrapper.length);
  }

  private lineEndIndex(value: string, from: number): number {
    const next = value.indexOf('\n', from);
    return next === -1 ? value.length : next;
  }

  private replaceAnswerRange(
    textarea: HTMLTextAreaElement,
    start: number,
    end: number,
    text: string,
    caretOffset: number
  ): void {
    const next = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    if (next.length > this.answerMaxLength) return;
    this.userAnswer.set(next);
    // The signal write only reaches the textarea on the next tick, so restore the caret after it.
    const caret = start + caretOffset;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
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
      const rawItems = this.parseImportJson(await file.text());
      const canonicalNameByLower = new Map(this.practice.categories().map(c => [c.name.toLowerCase(), c.name]));
      const items = rawItems.map(item => {
        const lower = item.category.toLowerCase();
        const canonical = canonicalNameByLower.get(lower);
        if (canonical) return { ...item, category: canonical };
        canonicalNameByLower.set(lower, item.category);
        this.practice.addCategory(item.category, this.randomCategoryColor());
        return item;
      });

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
    this.hintOpen.set(false);
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
    const status = this.selectedStatus();
    let list = this.practice.questions().filter(q => q.category === name);
    if (status === 'failed') {
      list = list.filter(q => q.feedback === 'incorrect');
    } else if (status === 'unanswered') {
      list = list.filter(q => q.feedback === null);
    }
    return list.length;
  }

  categoryMastery(name: string): number {
    const qs = this.practice.questions().filter(q => q.category === name);
    if (!qs.length) return 0;
    return Math.round((qs.filter(q => q.feedback === 'correct').length / qs.length) * 100);
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
