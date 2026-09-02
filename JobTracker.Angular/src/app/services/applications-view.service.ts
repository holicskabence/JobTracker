import { Injectable, computed, inject, signal } from '@angular/core';
import { BreakpointService } from './breakpoint.service';

export type ApplicationsView = 'kanban' | 'table' | 'history';

const STORAGE_KEY = 'jobtracker.applicationsView';
const VIEWS: ApplicationsView[] = ['kanban', 'table', 'history'];

function storedView(): ApplicationsView {
  const stored = localStorage.getItem(STORAGE_KEY) as ApplicationsView | null;
  return stored && VIEWS.includes(stored) ? stored : 'kanban';
}

@Injectable({ providedIn: 'root' })
export class ApplicationsViewService {
  private readonly breakpoint = inject(BreakpointService);

  private readonly selectedView = signal<ApplicationsView>(storedView());

  readonly canUseKanban = computed(() => !this.breakpoint.isMobile());

  readonly view = computed<ApplicationsView>(() => {
    const view = this.selectedView();
    return view === 'kanban' && !this.canUseKanban() ? 'table' : view;
  });

  setView(view: ApplicationsView): void {
    this.selectedView.set(view);
    localStorage.setItem(STORAGE_KEY, view);
  }
}
