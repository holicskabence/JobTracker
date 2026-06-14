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
  duplicate = false;

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
      this.duplicate = false;
    }
  }

  get isEdit(): boolean { return this.editJob != null; }

  private isDuplicate(company: string, position: string): boolean {
    return this.store.jobs().some(j =>
      j.id !== this.editJob?.id &&
      j.company.trim().toLowerCase() === company.toLowerCase() &&
      j.position.trim().toLowerCase() === position.toLowerCase()
    );
  }

  submit(): void {
    this.submitted = true;
    this.duplicate = false;
    if (!this.company.trim() || !this.position.trim()) return;

    const company = this.company.trim();
    const position = this.position.trim();

    if (this.isDuplicate(company, position)) {
      this.duplicate = true;
      return;
    }

    const data = {
      company,
      position,
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
