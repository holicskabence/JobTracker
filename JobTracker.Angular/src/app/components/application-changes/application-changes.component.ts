import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { JobStoreService } from '../../services/job-store.service';
import { CardComponent } from '../shared/card/card.component';
import { SortableHeaderCellComponent } from '../shared/sortable-header-cell/sortable-header-cell.component';
import { DataTableComponent } from '../shared/data-table/data-table.component';

type SortKey = 'company' | 'changedAt';
type SortDir = 'asc' | 'description';

@Component({
  selector: 'app-application-changes',
  standalone: true,
  imports: [TranslateModule, CardComponent, SortableHeaderCellComponent, DataTableComponent],
  templateUrl: './application-changes.component.html',
  styleUrl: './application-changes.component.css'
})
export class ApplicationChangesComponent {
  readonly store = inject(JobStoreService);

  readonly search = input('');

  readonly sortKey = signal<SortKey>('changedAt');
  readonly sortDir = signal<SortDir>('description');

  readonly sortedEntries = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return [...this.store.filterStatusHistory(this.search())].sort((a, b) => {
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
