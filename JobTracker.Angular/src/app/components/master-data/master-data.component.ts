import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlannerService } from '../../services/planner.service';
import { JobStoreService } from '../../services/job-store.service';

@Component({
  selector: 'app-master-data',
  imports: [FormsModule],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.css'
})
export class MasterDataComponent {
  readonly planner = inject(PlannerService);
  readonly jobStore = inject(JobStoreService);

  newEventTypeName = '';
  newStatusLabel = '';
  newStatusColor = '#5fb9fa';

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
}
