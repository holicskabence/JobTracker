import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { JobStatusHistoryEntry } from '../../models/job.model';
import { JobApiService } from '../../services/job-api.service';
import { JobStoreService } from '../../services/job-store.service';
import { CardComponent } from '../shared/card/card.component';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { SearchToolbarComponent } from '../shared/search-toolbar/search-toolbar.component';
import { SortableHeaderCellComponent } from '../shared/sortable-header-cell/sortable-header-cell.component';
import { DataTableComponent } from '../shared/data-table/data-table.component';

type SortKey = 'company' | 'changedAt';
type SortDir = 'asc' | 'description';

@Component({
  selector: 'app-application-changes',
  standalone: true,
  imports: [TranslateModule, CardComponent, PageSectionComponent, SearchToolbarComponent, SortableHeaderCellComponent, DataTableComponent],
  templateUrl: './application-changes.component.html',
  styleUrl: './application-changes.component.css'
})
export class ApplicationChangesComponent implements OnInit {
  private readonly api = inject(JobApiService);
  readonly store = inject(JobStoreService);

  readonly entries = signal<JobStatusHistoryEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly sortKey = signal<SortKey>('changedAt');
  readonly sortDir = signal<SortDir>('description');
  readonly searchRaw = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getJobStatusHistory().subscribe({
      next: entries => { this.entries.set(entries); this.loading.set(false); },
      error: () => { this.error.set('Nem sikerült betölteni a jelentkezés változásokat.'); this.loading.set(false); }
    });
  }

  readonly sortedEntries = computed(() => {
    const raw = this.searchRaw().trim().toLowerCase();
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    let entries = this.entries();

    if (raw) {
      entries = entries.filter(e =>
        e.company.toLowerCase().includes(raw) ||
        e.position.toLowerCase().includes(raw) ||
        this.store.labelFor(e.newStatus).toLowerCase().includes(raw) ||
        (e.previousStatus ? this.store.labelFor(e.previousStatus).toLowerCase().includes(raw) : false)
      );
    }

    return [...entries].sort((a, b) => {
      const va = key === 'company' ? a.company : a.changedAt;
      const vb = key === 'company' ? b.company : b.changedAt;
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  });

  sort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update(d => d === 'asc' ? 'description' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'changedAt' ? 'description' : 'asc');
    }
  }

  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number) { return this.store.colorAlpha(status, a); }
  statusLabel(status: string): string { return this.store.labelFor(status); }

  fmtDateTime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
