import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { gsap } from 'gsap';
import { TranslateService } from '@ngx-translate/core';
import { JobStoreService } from '../../../services/job-store.service';

export interface DonutSlice {
  status: string;
  label: string;
  value: number;
  color: string;
  path: string;
  midAngle: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.css'
})
export class DonutChartComponent {
  private readonly store = inject(JobStoreService);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly translate = inject(TranslateService);

  readonly hoveredSlice = signal<DonutSlice | null>(null);

  readonly CX = 100;
  readonly CY = 100;
  readonly R = 78;
  readonly IR = 54;
  readonly GAP_DEG = 4;

  readonly total = computed(() => this.store.jobs().length);

  readonly slices = computed(() => {
    const jobs = this.store.jobs();
    const configs = this.store.statusConfigs();

    const distMap: Record<string, number> = {};
    for (const job of jobs) {
      distMap[job.status] = (distMap[job.status] ?? 0) + 1;
    }

    const nonZero = Object.entries(distMap).filter(([, v]) => v > 0);
    const sum = nonZero.reduce((s, [, v]) => s + v, 0);
    if (sum === 0) return [];

    const gapTotal = nonZero.length * this.GAP_DEG;
    const available = 360 - gapTotal;
    let angle = -90;

    return nonZero.map(([status, value]) => {
      const cfg = configs.find(c => c.key === status);
      const sweep = (value / sum) * available;
      const startDeg = angle + this.GAP_DEG / 2;
      const endDeg = startDeg + sweep;
      angle = endDeg + this.GAP_DEG / 2;

      return {
        status,
        label: cfg?.label ?? status,
        value,
        color: cfg?.color ?? '#9b9b99',
        path: this.arc(startDeg, endDeg),
        midAngle: (startDeg + endDeg) / 2
      };
    });
  });

  get centerValue(): string {
    const h = this.hoveredSlice();
    return h ? String(h.value) : String(this.total());
  }

  get centerLabel(): string {
    const h = this.hoveredSlice();
    return h ? h.label : this.translate.instant('statistics.statusDistribution.total');
  }

  hoverSlice(status: string): void {
    if (this.hoveredSlice()?.status === status) return;

    const idx = this.slices().findIndex(s => s.status === status);
    const paths = this.el.nativeElement.querySelectorAll<SVGPathElement>('.slice');

    gsap.to(paths, { scale: 1, duration: 0.15 });

    if (idx >= 0 && paths[idx]) {
      gsap.to(paths[idx], { scale: 1.1, duration: 0.22, ease: 'back.out(1.5)' });
    }

    this.hoveredSlice.set(this.slices()[idx] ?? null);

    const val = this.el.nativeElement.querySelector('.donut-center-value')!;
    const lbl = this.el.nativeElement.querySelector('.donut-center-label')!;
    gsap.fromTo([val, lbl],
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(1.4)', stagger: 0.04 }
    );
  }

  clearHover(): void {
    if (!this.hoveredSlice()) return;

    const paths = this.el.nativeElement.querySelectorAll<SVGPathElement>('.slice');
    gsap.to(paths, { scale: 1, duration: 0.18, ease: 'power2.out' });

    this.hoveredSlice.set(null);

    const val = this.el.nativeElement.querySelector('.donut-center-value')!;
    const lbl = this.el.nativeElement.querySelector('.donut-center-label')!;
    gsap.fromTo([val, lbl],
      { opacity: 0.7, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out', stagger: 0.03 }
    );
  }

  private arc(startDeg: number, endDeg: number): string {
    const toR = (d: number) => (d * Math.PI) / 180;
    const cos = (d: number) => Math.cos(toR(d));
    const sin = (d: number) => Math.sin(toR(d));

    const x1 = this.CX + this.R * cos(startDeg);
    const y1 = this.CY + this.R * sin(startDeg);
    const x2 = this.CX + this.R * cos(endDeg);
    const y2 = this.CY + this.R * sin(endDeg);
    const x3 = this.CX + this.IR * cos(endDeg);
    const y3 = this.CY + this.IR * sin(endDeg);
    const x4 = this.CX + this.IR * cos(startDeg);
    const y4 = this.CY + this.IR * sin(startDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;

    const f = (n: number) => n.toFixed(3);
    return [
      `M ${f(x1)} ${f(y1)}`,
      `A ${this.R} ${this.R} 0 ${large} 1 ${f(x2)} ${f(y2)}`,
      `L ${f(x3)} ${f(y3)}`,
      `A ${this.IR} ${this.IR} 0 ${large} 0 ${f(x4)} ${f(y4)}`,
      'Z'
    ].join(' ');
  }
}
