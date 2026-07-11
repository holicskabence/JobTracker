import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Job, JobStatus } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [KanbanColumnComponent, TranslateModule],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css'
})
export class KanbanComponent {
  readonly store = inject(JobStoreService);

  readonly search = input('');

  readonly columns = computed(() => this.store.statusConfigs().filter(c => c.showInKanban !== false));
  readonly selectedIds = signal(new Set<number>());
  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly selectionCount = computed(() => this.selectedIds().size);

  readonly isFiltering = computed(() => this.search().trim().length > 0);

  private readonly filteredJobs = computed(() => {
    const term = this.search().trim().toLowerCase();
    const jobs = this.store.jobs();
    if (!term) return jobs;
    return jobs.filter(j =>
      j.company.toLowerCase().includes(term) ||
      j.position.toLowerCase().includes(term) ||
      this.store.labelFor(j.status).toLowerCase().includes(term)
    );
  });

  readonly jobsByStatus = computed(() => {
    const jobs = this.filteredJobs();
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
