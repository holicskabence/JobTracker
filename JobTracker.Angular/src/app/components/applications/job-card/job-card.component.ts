import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Job, JobStatus } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';
import { StatusDropdownComponent } from '../../shared/status-dropdown/status-dropdown.component';
import { CardComponent } from '../../shared/card/card.component';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [StatusDropdownComponent, CardComponent],
  templateUrl: './job-card.component.html',
  styleUrl: './job-card.component.css'
})
export class JobCardComponent {
  @Input({ required: true }) job!: Job;
  @Input() isSelected = false;
  @Output() toggleSelect = new EventEmitter<number>();

  constructor(private readonly store: JobStoreService) { }

  isDragging = false;

  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', String(this.job.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    this.isDragging = true;
  }

  onDragEnd(): void {
    this.isDragging = false;
  }

  onCardClick(): void {
    this.toggleSelect.emit(this.job.id);
  }

  onStatusChange(status: JobStatus): void {
    this.store.changeStatus(this.job.id, status);
  }

  onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    this.store.openModal(this.job);
  }

  safeLink(link: string): string {
    return link.startsWith('http') ? link : `https://${link}`;
  }
}
