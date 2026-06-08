import { Component, computed, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlannerService } from '../../services/planner.service';
import { JobStoreService } from '../../services/job-store.service';
import { PracticeService } from '../../services/practice.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.css'
})
export class MasterDataComponent {
  readonly planner = inject(PlannerService);
  readonly jobStore = inject(JobStoreService);
  readonly practice = inject(PracticeService);
  private readonly auth = inject(AuthService);

  readonly isDemoUser = computed(() => this.auth.currentUser()?.email === 'benceholicska@gmail.com');

  newEventTypeName = '';
  newStatusLabel = '';
  newStatusColor = '#5fb9fa';

  newQuestionCategory = '';
  newQuestionText = '';
  newQuestionHint = '';
  newQuestionSampleAnswer = '';
  questionFormOpen = false;

  newCategoryName = '';
  newCategoryColor = '#5fb9fa';
  categoryFormOpen = false;

  readonly STATUS_PRESETS = ['#9b9b99', '#5fb9fa', '#f59e0b', '#26ac00', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  addEventType(): void {
    if (!this.newEventTypeName.trim()) return;
    this.planner.addEventType(this.newEventTypeName.trim());
    this.newEventTypeName = '';
  }

  deleteEventType(type: string): void {
    if (this.planner.eventTypes().length <= 1) return;
    this.planner.deleteEventType(type);
  }

  addStatus(): void {
    if (!this.newStatusLabel.trim()) return;
    this.jobStore.addStatus(this.newStatusLabel.trim(), this.newStatusColor);
    this.newStatusLabel = '';
    this.newStatusColor = '#5fb9fa';
  }

  deleteStatus(key: string): void {
    this.jobStore.deleteStatus(key);
  }

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
    this.newQuestionCategory = name;
    this.catDropOpen = false;
  }

  @HostListener('document:click')
  closeCatDrop(): void { this.catDropOpen = false; }

  categoryColor(name: string): string {
    return this.practice.categories().find(c => c.name === name)?.color ?? '#9b9b99';
  }

  toggleQuestionForm(): void {
    this.questionFormOpen = !this.questionFormOpen;
    if (this.questionFormOpen && !this.newQuestionCategory) {
      this.newQuestionCategory = this.practice.categories()[0]?.name ?? '';
    }
  }

  addQuestion(): void {
    if (!this.newQuestionCategory || !this.newQuestionText.trim() || !this.newQuestionSampleAnswer.trim()) return;
    this.practice.addQuestion({
      category: this.newQuestionCategory,
      question: this.newQuestionText.trim(),
      hint: this.newQuestionHint.trim(),
      sampleAnswer: this.newQuestionSampleAnswer.trim()
    });
    this.newQuestionText = '';
    this.newQuestionHint = '';
    this.newQuestionSampleAnswer = '';
    this.questionFormOpen = false;
  }

  deleteQuestion(id: number): void {
    this.practice.deleteQuestion(id);
  }

  toggleCategoryForm(): void {
    this.categoryFormOpen = !this.categoryFormOpen;
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.practice.addCategory(this.newCategoryName.trim(), this.newCategoryColor);
    this.newCategoryName = '';
    this.newCategoryColor = '#5fb9fa';
    this.categoryFormOpen = false;
  }

  deleteCategory(id: number): void {
    if (this.practice.categories().length <= 1) return;
    this.practice.deleteCategory(id);
  }
}
