import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Job, JobStatus } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';
import { StatusDropdownComponent } from '../status-dropdown/status-dropdown.component';

@Component({
  selector: 'app-add-job-modal',
  standalone: true,
  imports: [FormsModule, StatusDropdownComponent],
  templateUrl: './add-job-modal.component.html',
  styleUrl: './add-job-modal.component.css'
})
export class AddJobModalComponent implements OnChanges {
  @Input() editJob: Job | null = null;
  @Output() close = new EventEmitter<void>();

  company = '';
  position = '';
  link = '';
  status: JobStatus = 'Mentett';
  submitted = false;

  constructor(private readonly store: JobStoreService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editJob']) {
      const job = changes['editJob'].currentValue as Job | null;
      if (job) {
        this.company = job.company;
        this.position = job.position;
        this.link = job.link ?? '';
        this.status = job.status;
      } else {
        this.company = '';
        this.position = '';
        this.link = '';
        this.status = 'Mentett';
        this.submitted = false;
      }
    }
  }

  get isEdit(): boolean { return this.editJob != null; }

  submit(): void {
    this.submitted = true;
    if (!this.company.trim() || !this.position.trim()) return;
    const data = {
      company: this.company.trim(),
      position: this.position.trim(),
      link: this.link.trim() || undefined,
      status: this.status
    };
    if (this.isEdit) {
      this.store.updateJob(this.editJob!.id, {
        ...data,
        date: this.editJob!.date
      });
    } else {
      this.store.addJob(data);
    }
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
