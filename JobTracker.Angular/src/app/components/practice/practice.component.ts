import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PREP_QUESTIONS, PrepQuestion, FeedbackType, QuestionCategory } from '../../models/practice.model';

type FilterCategory = 'Mind' | QuestionCategory;

@Component({
  selector: 'app-practice',
  imports: [FormsModule],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css'
})
export class PracticeComponent {
  readonly allQuestions = PREP_QUESTIONS;
  readonly categories: FilterCategory[] = ['Mind', 'Technikai', 'HR', 'Rendszertervezés'];

  readonly selectedCategory = signal<FilterCategory>('Mind');
  readonly currentIdx = signal(0);
  readonly userAnswer = signal('');
  readonly showSample = signal(false);
  readonly feedbackMap = signal<Map<number, FeedbackType>>(new Map());

  readonly filteredQuestions = computed<PrepQuestion[]>(() => {
    const cat = this.selectedCategory();
    return cat === 'Mind'
      ? this.allQuestions
      : this.allQuestions.filter(q => q.category === cat);
  });

  readonly currentQuestion = computed<PrepQuestion | null>(() => {
    const list = this.filteredQuestions();
    const idx = this.currentIdx();
    return list[idx] ?? null;
  });

  readonly progress = computed(() => {
    const list = this.filteredQuestions();
    return list.length === 0 ? 0 : Math.round(((this.currentIdx() + 1) / list.length) * 100);
  });

  readonly answeredCount = computed(() => {
    const fb = this.feedbackMap();
    return this.filteredQuestions().filter(q => fb.has(q.id)).length;
  });

  readonly ratingBreakdown = computed(() => {
    const fb = this.feedbackMap();
    const list = this.filteredQuestions();
    const rated = list.filter(q => fb.has(q.id));
    return {
      hard: rated.filter(q => fb.get(q.id) === 'hard').length,
      good: rated.filter(q => fb.get(q.id) === 'good').length,
      easy: rated.filter(q => fb.get(q.id) === 'easy').length,
      total: list.length
    };
  });

  readonly readinessScore = computed(() => {
    const { hard, good, easy, total } = this.ratingBreakdown();
    if (total === 0) return 0;
    return Math.round(((easy * 1 + good * 0.6 + hard * 0.2) / total) * 100);
  });

  selectCategory(cat: FilterCategory): void {
    this.selectedCategory.set(cat);
    this.currentIdx.set(0);
    this.userAnswer.set('');
    this.showSample.set(false);
  }

  revealSample(): void {
    if (this.userAnswer().trim()) {
      this.showSample.set(true);
    }
  }

  rate(type: FeedbackType): void {
    const q = this.currentQuestion();
    if (!q) return;
    const map = new Map(this.feedbackMap());
    map.set(q.id, type);
    this.feedbackMap.set(map);
    setTimeout(() => this.next(), 350);
  }

  next(): void {
    const max = this.filteredQuestions().length - 1;
    if (this.currentIdx() < max) {
      this.currentIdx.update(i => i + 1);
      this.userAnswer.set('');
      this.showSample.set(false);
    }
  }

  prev(): void {
    if (this.currentIdx() > 0) {
      this.currentIdx.update(i => i - 1);
      this.userAnswer.set('');
      this.showSample.set(false);
    }
  }

  getFeedback(id: number): FeedbackType | undefined {
    return this.feedbackMap().get(id);
  }

  getReadinessLabel(): string {
    const score = this.readinessScore();
    if (score >= 80) return 'Kiváló';
    if (score >= 60) return 'Jó';
    if (score >= 40) return 'Fejleszthető';
    return 'Kezdő';
  }

  getReadinessColor(): string {
    const score = this.readinessScore();
    if (score >= 80) return '#26ac00';
    if (score >= 60) return '#5fb9fa';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  feedbackLabel(fb: FeedbackType | undefined): string {
    if (fb === 'easy') return 'EASY';
    if (fb === 'good') return 'GOOD';
    if (fb === 'hard') return 'HARD';
    return '';
  }

  categorySlug(cat: QuestionCategory): string {
    if (cat === 'Technikai') return 'tech';
    if (cat === 'HR') return 'hr';
    return 'sys';
  }

  trackByCategory(_: number, cat: FilterCategory): string { return cat; }
  trackByQuestion(_: number, q: PrepQuestion): number { return q.id; }
}
