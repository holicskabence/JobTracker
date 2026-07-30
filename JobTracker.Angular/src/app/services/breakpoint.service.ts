import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly mql = window.matchMedia('(max-width: 767px)');
  readonly isMobile = signal(this.mql.matches);

  constructor() {
    this.mql.addEventListener('change', e => this.isMobile.set(e.matches));
  }

  /** Reactive signal for an arbitrary media query, e.g. watch('(max-width: 1399px)'). */
  watch(query: string): Signal<boolean> {
    const mql = window.matchMedia(query);
    const matches = signal(mql.matches);
    mql.addEventListener('change', e => matches.set(e.matches));
    return matches.asReadonly();
  }
}
