import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Job, JobStatus } from '../../../models/job.model';
import { JobCardComponent } from '../job-card/job-card.component';

@Component({
  selector: 'app-kanban-column',
  imports: [JobCardComponent],
  templateUrl: './kanban-column.component.html',
  styleUrl: './kanban-column.component.css'
})
export class KanbanColumnComponent {
  @Input({ required: true }) status!: JobStatus;
  @Input({ required: true }) label!: string;
  @Input() color = '#9b9b99';
  @Input() jobs: Job[] = [];
  @Input() selectedIds = new Set<number>();

  @Output() toggleSelect = new EventEmitter<number>();
  @Output() dropped = new EventEmitter<{ jobId: number; status: string }>();

  isDragOver = false;

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    const target = event.currentTarget as HTMLElement;
    if (related && target.contains(related)) return;
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const id = Number(event.dataTransfer?.getData('text/plain'));
    if (id > 0) {
      this.dropped.emit({ jobId: id, status: this.status });
    }
  }
}
