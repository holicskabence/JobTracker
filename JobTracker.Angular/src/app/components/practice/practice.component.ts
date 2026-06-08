import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PracticeService } from '../../services/practice.service';
import { FeedbackType, PrepQuestion, QuestionCategory } from '../../models/practice.model';

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

  readonly categories = computed<FilterCategory[]>(() =>
    ['Mind', ...this.practice.categories().map(c => c.name)]
  );

  readonly selectedCategory = signal<FilterCategory>('Mind');
  readonly currentIdx = signal(0);
  readonly userAnswer = signal('');
  readonly showSample = signal(false);

  readonly filteredQuestions = computed<PrepQuestion[]>(() => {
    const cat = this.selectedCategory();
    const all = this.practice.questions();
    return cat === 'Mind' ? all : all.filter(q => q.category === cat);
  });

  readonly currentQuestion = computed<PrepQuestion | null>(() => {
    const list = this.filteredQuestions();
    const idx = this.currentIdx();
    return list[idx] ?? null;
  });

  readonly cardDeck = computed<PrepQuestion[]>(() => {
    const q = this.currentQuestion();
    return q ? [q] : [];
  });

  readonly answeredCount = computed(() =>
    this.filteredQuestions().filter(q => q.feedback !== null).length
  );

  readonly ratingBreakdown = computed(() => {
    const list = this.filteredQuestions();
    return {
      hard: list.filter(q => q.feedback === 'hard').length,
      good: list.filter(q => q.feedback === 'good').length,
      easy: list.filter(q => q.feedback === 'easy').length,
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
    this.practice.rate(q.id, type);
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

  getFeedback(id: number): FeedbackType | null {
    return this.practice.questions().find(q => q.id === id)?.feedback ?? null;
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

  feedbackLabel(fb: FeedbackType | null): string {
    if (fb === 'easy') return 'EASY';
    if (fb === 'good') return 'GOOD';
    if (fb === 'hard') return 'HARD';
    return '';
  }

  categoryColor(cat: QuestionCategory): string {
    return this.practice.categories().find(c => c.name === cat)?.color ?? '#9b9b99';
  }

  trackByCategory(_: number, cat: FilterCategory): string { return cat; }
  trackByQuestion(_: number, q: PrepQuestion): number { return q.id; }
}
