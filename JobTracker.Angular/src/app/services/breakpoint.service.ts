import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly mql = window.matchMedia('(max-width: 767px)');
  readonly isMobile = signal(this.mql.matches);

  constructor() {
    this.mql.addEventListener('change', e => this.isMobile.set(e.matches));
  }
}
