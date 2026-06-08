import { Component, computed, inject, signal } from '@angular/core';
import { Job, JobStatus } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [KanbanColumnComponent],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css'
})
export class KanbanComponent {
  readonly store = inject(JobStoreService);

  readonly columns = computed(() => this.store.statusConfigs());
  readonly selectedIds = signal(new Set<number>());
  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly selectionCount = computed(() => this.selectedIds().size);

  readonly jobsByStatus = computed(() => {
    const jobs = this.store.jobs();
    const map = new Map<string, Job[]>();
    for (const cfg of this.store.statusConfigs()) {
      map.set(cfg.key, jobs.filter(j => j.status === cfg.key));
    }
    return map;
  });

  jobsFor(key: string): Job[] {
    return this.jobsByStatus().get(key) ?? [];
  }

  onDrop(event: { jobId: number; status: string }): void {
    this.store.changeStatus(event.jobId, event.status);
  }

  toggle(id: number): void {
    this.selectedIds.update(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  moveTo(status: JobStatus): void {
    [...this.selectedIds()].forEach(id => this.store.changeStatus(id, status));
    this.clearSelection();
  }
}
