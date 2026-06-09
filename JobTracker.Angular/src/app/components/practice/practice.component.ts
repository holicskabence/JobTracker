import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PracticeService } from '../../services/practice.service';
import { PracticeApiService } from '../../services/practice-api.service';
import { AuthService } from '../../services/auth.service';
import { FeedbackType, PrepQuestion, QuestionCategory } from '../../models/practice.model';

type Tab = 'practice' | 'questions' | 'results';
type FilterCategory = 'Mind' | QuestionCategory;

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [FormsModule],
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
  readonly selectedCategory = signal<FilterCategory>('Mind');
  readonly showOnlyFailed = signal(false);
  readonly currentIdx = signal(0);
  readonly userAnswer = signal('');
  readonly showSample = signal(false);

  readonly filteredQuestions = computed<PrepQuestion[]>(() => {
    const cat = this.selectedCategory();
    const onlyFailed = this.showOnlyFailed();
    let list = this.practice.questions();
    if (cat !== 'Mind') list = list.filter(q => q.category === cat);
    if (onlyFailed) list = list.filter(q => q.feedback === 'incorrect');
    return list;
  });

  readonly currentQuestion = computed<PrepQuestion | null>(() =>
    this.filteredQuestions()[this.currentIdx()] ?? null
  );

  readonly leavingCard = signal<PrepQuestion | null>(null);
  readonly animDir = signal<'fwd' | 'bwd'>('fwd');

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

  readonly useAiEvaluation = computed(() => this.auth.currentUser()?.useAiEvaluation ?? false);

  readonly aiLoading = signal(false);
  readonly aiFeedback = signal<string | null>(null);
  readonly aiTypedText = signal('');
  readonly aiVerdict = signal<'correct' | 'incorrect' | null>(null);
  readonly aiError = signal<string | null>(null);
  readonly aiDone = signal(false);

  readonly showAddForm = signal(false);
  readonly formCat = signal('');
  readonly formQuestion = signal('');
  readonly formHint = signal('');
  readonly formSampleAnswer = signal('');
  readonly formError = signal('');

  readonly showAddCatForm = signal(false);
  readonly newCatName = signal('');
  readonly newCatColor = signal('#26ac00');

  readonly catColors = ['#26ac00', '#5fb9fa', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6'];

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

  selectCategory(cat: FilterCategory): void {
    this.leavingCard.set(null);
    this.selectedCategory.set(cat);
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
  }

  toggleFailed(): void {
    this.leavingCard.set(null);
    this.showOnlyFailed.update(v => !v);
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
    this.practice.rate(q.id, type);
    setTimeout(() => this.next(), 350);
  }

  next(): void {
    if (this.currentIdx() >= this.filteredQuestions().length - 1) return;
    this.leavingCard.set(this.currentQuestion());
    this.animDir.set('fwd');
    this.currentIdx.update(i => i + 1);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
    setTimeout(() => this.leavingCard.set(null), 430);
  }

  prev(): void {
    if (this.currentIdx() <= 0) return;
    this.leavingCard.set(this.currentQuestion());
    this.animDir.set('bwd');
    this.currentIdx.update(i => i - 1);
    this.userAnswer.set('');
    this.showSample.set(false);
    this.resetAi();
    setTimeout(() => this.leavingCard.set(null), 430);
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.formCat.set(this.practice.categories()[0]?.name ?? '');
    this.formQuestion.set('');
    this.formHint.set('');
    this.formSampleAnswer.set('');
    this.formError.set('');
  }

  cancelAddForm(): void { this.showAddForm.set(false); }

  submitQuestion(): void {
    const cat = this.formCat().trim();
    const q = this.formQuestion().trim();
    const h = this.formHint().trim();
    const sa = this.formSampleAnswer().trim();
    if (!cat) { this.formError.set('Válassz kategóriát.'); return; }
    if (!q) { this.formError.set('A kérdés szövege kötelező.'); return; }
    if (!sa) { this.formError.set('A mintaválasz kötelező.'); return; }
    this.formError.set('');
    this.practice.addQuestion({ category: cat, question: q, hint: h, sampleAnswer: sa });
    this.showAddForm.set(false);
  }

  deleteQuestion(id: number): void { this.practice.deleteQuestion(id); }

  openAddCatForm(): void { this.showAddCatForm.set(true); this.newCatName.set(''); }
  cancelAddCatForm(): void { this.showAddCatForm.set(false); }
  submitCategory(): void {
    const name = this.newCatName().trim();
    if (!name) return;
    this.practice.addCategory(name, this.newCatColor());
    this.showAddCatForm.set(false);
  }
  deleteCategory(id: number): void { this.practice.deleteCategory(id); }

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

  countByCategory(name: string): number {
    return this.practice.questions().filter(q => q.category === name).length;
  }

  trackByCategory(_: number, cat: FilterCategory): string { return cat; }
  trackByQuestion(_: number, q: PrepQuestion): number { return q.id; }
}
