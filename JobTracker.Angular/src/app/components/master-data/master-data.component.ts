import { Component, computed, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PlannerService } from '../../services/planner.service';
import { JobStoreService } from '../../services/job-store.service';
import { PracticeService } from '../../services/practice.service';
import { AuthService } from '../../services/auth.service';
import { CardComponent } from '../shared/card/card.component';
import { BadgeComponent } from '../shared/badge/badge.component';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';
import { JobStatusConfig, StatsCategory } from '../../models/job.model';
import { PracticeCategory } from '../../models/practice.model';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [FormsModule, TranslateModule, CardComponent, BadgeComponent, PageHeaderComponent],
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

  draggedStatusIndex: number | null = null;
  dragOverStatusIndex: number | null = null;

  onStatusDragStart(index: number): void {
    this.draggedStatusIndex = index;
  }

  onStatusDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverStatusIndex = index;
  }

  onStatusDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (this.draggedStatusIndex !== null && this.draggedStatusIndex !== targetIndex) {
      this.jobStore.moveStatusToIndex(this.draggedStatusIndex, targetIndex);
    }
    this.draggedStatusIndex = null;
    this.dragOverStatusIndex = null;
  }

  onStatusDragEnd(): void {
    this.draggedStatusIndex = null;
    this.dragOverStatusIndex = null;
  }

  moveStatusUp(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.jobStore.moveStatusUp(key);
  }

  moveStatusDown(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.jobStore.moveStatusDown(key);
  }

  toggleStatusKanban(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.jobStore.toggleStatusKanban(key);
  }

  readonly STATS_CATEGORIES: StatsCategory[] = ['None', 'Success', 'Rejected'];

  setStatusCategory(key: string, category: string, event: Event): void {
    event.stopPropagation();
    this.jobStore.setStatusCategory(key, category as StatsCategory);
  }

  toggleStatusActive(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.jobStore.toggleStatusActive(key);
  }

  toggleStatusInterview(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.jobStore.toggleStatusInterview(key);
  }

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
    this.newQuestionCategory = name;
    this.catDropOpen = false;
  }

  statusCatDropOpen: string | null = null;
  statusCatDropTop = 0;
  statusCatDropLeft = 0;
  statusCatDropWidth = 0;

  toggleStatusCatDrop(cfg: JobStatusConfig, event: MouseEvent): void {
    event.stopPropagation();
    if (this.statusCatDropOpen === cfg.key) {
      this.statusCatDropOpen = null;
      return;
    }
    const button = event.currentTarget as HTMLElement;
    const r = button.getBoundingClientRect();
    const estimatedH = this.STATS_CATEGORIES.length * 40 + 10;
    this.statusCatDropLeft = r.left;
    this.statusCatDropWidth = Math.max(r.width, 140);
    if (this.statusCatDropLeft + this.statusCatDropWidth > window.innerWidth - 8) {
      this.statusCatDropLeft = window.innerWidth - this.statusCatDropWidth - 8;
    }
    this.statusCatDropTop = (window.innerHeight - r.bottom - 8 >= estimatedH || r.top < estimatedH)
      ? r.bottom + 4
      : r.top - estimatedH - 4;
    this.statusCatDropOpen = cfg.key;
  }

  pickStatusCategory(key: string, category: string, event: MouseEvent): void {
    event.stopPropagation();
    this.jobStore.setStatusCategory(key, category as StatsCategory);
    this.statusCatDropOpen = null;
  }

  @HostListener('document:click')
  closeCatDrop(): void {
    this.catDropOpen = false;
    this.statusCatDropOpen = null;
  }

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

  selectCategory(category: PracticeCategory): void {
    if (this.selectedCategoryId === category.id) {
      this.cancelCategoryEdit();
      return;
    }
    this.selectedCategoryId = category.id;
    this.newCategoryName = category.name;
    this.newCategoryColor = category.color;
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
