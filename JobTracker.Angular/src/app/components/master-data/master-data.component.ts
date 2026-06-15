import { Component, computed, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlannerService } from '../../services/planner.service';
import { JobStoreService } from '../../services/job-store.service';
import { PracticeService } from '../../services/practice.service';
import { AuthService } from '../../services/auth.service';
import { CardComponent } from '../shared/card/card.component';
import { BadgeComponent } from '../shared/badge/badge.component';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';
import { JobStatusConfig } from '../../models/job.model';
import { PracticeCategory } from '../../models/practice.model';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [FormsModule, CardComponent, BadgeComponent, PageHeaderComponent],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.css'
})
export class MasterDataComponent {
  readonly planner = inject(PlannerService);
  readonly jobStore = inject(JobStoreService);
  readonly practice = inject(PracticeService);
  private readonly auth = inject(AuthService);

  readonly isDemoUser = computed(() => this.auth.currentUser()?.email === 'demo@jobtracker.app');

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

  selectedEventType: string | null = null;

  addEventType(): void {
    const trimmed = this.newEventTypeName.trim();
    if (!trimmed) return;
    if (this.selectedEventType) {
      this.planner.updateEventType(this.selectedEventType, trimmed);
      this.cancelEventTypeEdit();
      return;
    }
    this.planner.addEventType(trimmed);
    this.newEventTypeName = '';
  }

  selectEventType(type: string): void {
    if (this.selectedEventType === type) {
      this.cancelEventTypeEdit();
      return;
    }
    this.selectedEventType = type;
    this.newEventTypeName = type;
  }

  cancelEventTypeEdit(): void {
    this.selectedEventType = null;
    this.newEventTypeName = '';
  }

  deleteEventType(type: string): void {
    if (this.planner.eventTypes().length <= 1) return;
    if (this.selectedEventType === type) this.cancelEventTypeEdit();
    this.planner.deleteEventType(type);
  }

  selectedStatusKey: string | null = null;

  addStatus(): void {
    const trimmed = this.newStatusLabel.trim();
    if (!trimmed) return;
    if (this.selectedStatusKey) {
      this.jobStore.updateStatus(this.selectedStatusKey, trimmed, this.newStatusColor);
      this.cancelStatusEdit();
      return;
    }
    this.jobStore.addStatus(trimmed, this.newStatusColor);
    this.newStatusLabel = '';
    this.newStatusColor = '#5fb9fa';
  }

  selectStatus(cfg: JobStatusConfig): void {
    if (this.selectedStatusKey === cfg.key) {
      this.cancelStatusEdit();
      return;
    }
    this.selectedStatusKey = cfg.key;
    this.newStatusLabel = cfg.label;
    this.newStatusColor = cfg.color;
  }

  cancelStatusEdit(): void {
    this.selectedStatusKey = null;
    this.newStatusLabel = '';
    this.newStatusColor = '#5fb9fa';
  }

  deleteStatus(key: string): void {
    if (this.selectedStatusKey === key) this.cancelStatusEdit();
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

  selectedCategoryId: number | null = null;

  addCategory(): void {
    const trimmed = this.newCategoryName.trim();
    if (!trimmed) return;
    if (this.selectedCategoryId !== null) {
      this.practice.updateCategory(this.selectedCategoryId, trimmed, this.newCategoryColor);
      this.cancelCategoryEdit();
      return;
    }
    this.practice.addCategory(trimmed, this.newCategoryColor);
    this.newCategoryName = '';
    this.newCategoryColor = '#5fb9fa';
    this.categoryFormOpen = false;
  }

  selectCategory(cat: PracticeCategory): void {
    if (this.selectedCategoryId === cat.id) {
      this.cancelCategoryEdit();
      return;
    }
    this.selectedCategoryId = cat.id;
    this.newCategoryName = cat.name;
    this.newCategoryColor = cat.color;
  }

  cancelCategoryEdit(): void {
    this.selectedCategoryId = null;
    this.newCategoryName = '';
    this.newCategoryColor = '#5fb9fa';
  }

  deleteCategory(id: number): void {
    if (this.practice.categories().length <= 1) return;
    if (this.selectedCategoryId === id) this.cancelCategoryEdit();
    this.practice.deleteCategory(id);
  }
}
