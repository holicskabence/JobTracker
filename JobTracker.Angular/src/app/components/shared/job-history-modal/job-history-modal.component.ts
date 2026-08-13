import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';

@Component({
  selector: 'app-job-history-modal',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './job-history-modal.component.html',
  styleUrl: './job-history-modal.component.css'
})
export class JobHistoryModalComponent {
  private readonly store = inject(JobStoreService);

  readonly job = input.required<Job>();
  @Output() close = new EventEmitter<void>();

  readonly entries = computed(() => this.store.historyFor(this.job().id));

  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number): string { return this.store.colorAlpha(status, a); }
  statusLabel(status: string): string { return this.store.labelFor(status); }

  fmtDateTime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
