import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from '../../models/job.model';
import { JobStoreService } from '../../services/job-store.service';
import { CardComponent } from '../shared/card/card.component';
import { SearchToolbarComponent } from '../shared/search-toolbar/search-toolbar.component';
import { SortableHeaderCellComponent } from '../shared/sortable-header-cell/sortable-header-cell.component';
import { DataTableComponent } from '../shared/data-table/data-table.component';

type SortKey = 'company' | 'status' | 'date';
type SortDir = 'asc' | 'description';

@Component({
  selector: 'app-table-view',
  standalone: true,
  imports: [TranslateModule, CardComponent, SearchToolbarComponent, SortableHeaderCellComponent, DataTableComponent],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.css'
})
export class TableViewComponent {
  readonly store = inject(JobStoreService);

  openEdit(job: Job): void { this.store.openModal(job); }

  readonly sortKey = signal<SortKey>('date');
  readonly sortDir = signal<SortDir>('description');
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
      this.sortDir.update(d => d === 'asc' ? 'description' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'date' ? 'description' : 'asc');
    }
  }

  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number) { return this.store.colorAlpha(status, a); }
  statusLabel(status: string): string { return this.store.labelFor(status); }

  safeLink(link: string): string {
    return link.startsWith('http') ? link : `https://${link}`;
  }
}
