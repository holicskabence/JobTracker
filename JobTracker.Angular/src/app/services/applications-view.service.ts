import { Injectable, computed, inject, signal } from '@angular/core';
import { BreakpointService } from './breakpoint.service';

export type ApplicationsView = 'kanban' | 'table';

const STORAGE_KEY = 'jobtracker.applicationsView';

@Injectable({ providedIn: 'root' })
export class ApplicationsViewService {
  private readonly breakpoint = inject(BreakpointService);

  private readonly selectedView = signal<ApplicationsView>(
    localStorage.getItem(STORAGE_KEY) === 'table' ? 'table' : 'kanban'
  );

  readonly canUseKanban = computed(() => !this.breakpoint.isMobile());
  readonly view = computed<ApplicationsView>(() => this.canUseKanban() ? this.selectedView() : 'table');

  setView(view: ApplicationsView): void {
    this.selectedView.set(view);
    localStorage.setItem(STORAGE_KEY, view);
  }
}
