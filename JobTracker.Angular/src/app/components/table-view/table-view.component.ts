import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Job } from '../../models/job.model';
import { JobStoreService } from '../../services/job-store.service';
import { CardComponent } from '../shared/card/card.component';

type SortKey = 'company' | 'status' | 'date';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-table-view',
  standalone: true,
  imports: [NgClass, FormsModule, CardComponent],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.css'
})
export class TableViewComponent {
  readonly store = inject(JobStoreService);

  openEdit(job: Job): void { this.store.openModal(job); }

  readonly sortKey = signal<SortKey>('date');
  readonly sortDir = signal<SortDir>('desc');
  readonly searchRaw = signal('');

  readonly sortedJobs = computed(() => {
    const raw = this.searchRaw().trim().toLowerCase();
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    let jobs = this.store.jobs();

    if (raw) {
      jobs = jobs.filter(j =>
        j.company.toLowerCase().includes(raw) ||
        j.position.toLowerCase().includes(raw) ||
        this.store.labelFor(j.status).toLowerCase().includes(raw)
      );
    }

    return [...jobs].sort((a, b) => {
      const va = a[key] ?? '';
      const vb = b[key] ?? '';
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  });

  sort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'date' ? 'desc' : 'asc');
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number) { return this.store.colorAlpha(status, a); }
  statusLabel(status: string): string { return this.store.labelFor(status); }

  safeLink(link: string): string {
    return link.startsWith('http') ? link : `https://${link}`;
  }
}
