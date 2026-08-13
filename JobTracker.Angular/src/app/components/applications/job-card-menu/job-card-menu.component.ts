import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Job, JobStatus } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';

type PanelMode = 'main' | 'delete-confirm';

@Component({
  selector: 'app-job-card-menu',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './job-card-menu.component.html',
  styleUrl: './job-card-menu.component.css'
})
export class JobCardMenuComponent {
  private readonly store = inject(JobStoreService);

  readonly job = input.required<Job>();

  readonly isOpen = signal(false);
  readonly mode = signal<PanelMode>('main');
  panelTop = 0;
  panelLeft = 0;
  readonly panelWidth = 208;

  readonly moveOpen = signal(false);
  moveTop = 0;
  moveLeft = 0;

  readonly columns = computed(() => this.store.statusConfigs().filter(c => c.showInKanban !== false));

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isOpen()) {
      const button = event.currentTarget as HTMLElement;
      const r = button.getBoundingClientRect();
      const estimatedH = 160;

      this.panelLeft = r.right - this.panelWidth;
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
      this.mode.set('main');
    }
    this.isOpen.update(v => !v);
    this.moveOpen.set(false);
  }

  viewHistory(event: MouseEvent): void {
    event.stopPropagation();
    this.store.openHistory(this.job());
    this.closePanel();
  }

  toggleMove(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.moveOpen()) {
      const button = event.currentTarget as HTMLElement;
      const r = button.getBoundingClientRect();
      const estimatedH = Math.min(this.columns().length * 34 + 16, 320);

      let top = r.top - 4;
      if (top + estimatedH > window.innerHeight - 8) {
        top = window.innerHeight - estimatedH - 8;
      }
      if (top < 8) top = 8;
      this.moveTop = top;

      const rightSpace = window.innerWidth - (this.panelLeft + this.panelWidth) - 6;
      if (rightSpace >= this.panelWidth) {
        this.moveLeft = this.panelLeft + this.panelWidth + 6;
      } else {
        this.moveLeft = Math.max(this.panelLeft - this.panelWidth - 6, 8);
      }
    }
    this.moveOpen.update(v => !v);
  }

  moveTo(status: JobStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.store.changeStatus(this.job().id, status);
    this.closePanel();
  }

  askDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.mode.set('delete-confirm');
    this.moveOpen.set(false);
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.mode.set('main');
  }

  confirmDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.store.deleteJob(this.job().id);
    this.closePanel();
  }

  closePanel(): void {
    this.isOpen.set(false);
    this.mode.set('main');
    this.moveOpen.set(false);
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.closePanel();
  }

  colorFor(key: string): string { return this.store.colorFor(key); }
}
