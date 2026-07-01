import { Component, computed, HostListener, inject, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { JobStatus } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';

@Component({
  selector: 'app-status-dropdown',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './status-dropdown.component.html',
  styleUrl: './status-dropdown.component.css'
})
export class StatusDropdownComponent {
  private readonly store = inject(JobStoreService);

  @Input({ required: true }) value!: JobStatus;
  @Input() variant: 'dots' | 'form' = 'dots';
  @Output() valueChange = new EventEmitter<JobStatus>();

  isOpen = false;
  panelTop = 0;
  panelLeft = 0;
  panelWidth = 192;

  readonly options = computed(() => this.store.statusConfigs());

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isOpen) {
      const button = event.currentTarget as HTMLElement;
      const r = button.getBoundingClientRect();
      const estimatedH = this.options().length * 40 + 10;

      if (this.variant === 'form') {
        this.panelLeft = r.left;
        this.panelWidth = Math.max(r.width, 192);
      } else {
        this.panelWidth = 192;
        this.panelLeft = r.right - this.panelWidth;
      }

      if (this.panelLeft + this.panelWidth > window.innerWidth - 8) {
        this.panelLeft = window.innerWidth - this.panelWidth - 8;
      }
      if (this.panelLeft < 8) this.panelLeft = 8;

      const spaceBelow = window.innerHeight - r.bottom - 8;
      if (spaceBelow >= estimatedH || r.top < estimatedH) {
        this.panelTop = r.bottom + 4;
      } else {
        this.panelTop = r.top - estimatedH - 4;
      }
    }
    this.isOpen = !this.isOpen;
  }

  pick(key: JobStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(key);
    this.isOpen = false;
  }

  @HostListener('document:click')
  onDocClick(): void { this.isOpen = false; }

  colorFor(key: string): string { return this.store.colorFor(key); }
  labelFor(key: string): string { return this.store.labelFor(key); }
}
