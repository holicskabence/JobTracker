import { Component, ElementRef, Input, OnChanges } from '@angular/core';
import { gsap } from 'gsap';
import { JobStatus, STATUS_CSS_KEYS, STATUS_COLORS, STATUS_LABELS } from '../../../models/job.model';

export interface DonutSlice {
  status: JobStatus;
  label: string;
  value: number;
  color: string;
  cssKey: string;
  path: string;
  midAngle: number;
}

@Component({
  selector: 'app-donut-chart',
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.css'
})
export class DonutChartComponent implements OnChanges {
  @Input() distribution: Partial<Record<JobStatus, number>> = {};
  @Input() total = 0;

  slices: DonutSlice[] = [];
  hoveredSlice: DonutSlice | null = null;

  readonly CX = 100;
  readonly CY = 100;
  readonly R = 78;
  readonly IR = 54;
  readonly GAP_DEG = 4;

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnChanges(): void {
    this.hoveredSlice = null;
    this.buildSlices();
  }

  get centerValue(): string { return this.hoveredSlice ? String(this.hoveredSlice.value) : String(this.total); }
  get centerLabel(): string { return this.hoveredSlice ? this.hoveredSlice.label : 'Összes'; }

  hoverSlice(status: JobStatus): void {
    if (this.hoveredSlice?.status === status) return;

    const idx = this.slices.findIndex(s => s.status === status);
    const paths = this.el.nativeElement.querySelectorAll<SVGPathElement>('.slice');

    // Reset all to 1
    gsap.to(paths, { scale: 1, duration: 0.15 });

    if (idx >= 0 && paths[idx]) {
      gsap.to(paths[idx], { scale: 1.1, duration: 0.22, ease: 'back.out(1.5)' });
    }

    this.hoveredSlice = this.slices[idx] ?? null;

    const val = this.el.nativeElement.querySelector('.donut-center-value')!;
    const lbl = this.el.nativeElement.querySelector('.donut-center-label')!;
    gsap.fromTo([val, lbl],
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(1.4)', stagger: 0.04 }
    );
  }

  clearHover(): void {
    if (!this.hoveredSlice) return;

    const paths = this.el.nativeElement.querySelectorAll<SVGPathElement>('.slice');
    gsap.to(paths, { scale: 1, duration: 0.18, ease: 'power2.out' });

    this.hoveredSlice = null;

    const val = this.el.nativeElement.querySelector('.donut-center-value')!;
    const lbl = this.el.nativeElement.querySelector('.donut-center-label')!;
    gsap.fromTo([val, lbl],
      { opacity: 0.7, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out', stagger: 0.03 }
    );
  }

  private buildSlices(): void {
    const entries = Object.entries(this.distribution) as [JobStatus, number][];
    const nonZero = entries.filter(([, v]) => v > 0);
    const sum = nonZero.reduce((s, [, v]) => s + v, 0);
    if (sum === 0) { this.slices = []; return; }

    const gapTotal = nonZero.length * this.GAP_DEG;
    const available = 360 - gapTotal;
    let angle = -90;

    this.slices = nonZero.map(([status, value]) => {
      const sweep = (value / sum) * available;
      const startDeg = angle + this.GAP_DEG / 2;
      const endDeg = startDeg + sweep;
      angle = endDeg + this.GAP_DEG / 2;

      return {
        status,
        label: STATUS_LABELS[status],
        value,
        color: STATUS_COLORS[status],
        cssKey: STATUS_CSS_KEYS[status],
        path: this.arc(startDeg, endDeg),
        midAngle: (startDeg + endDeg) / 2
      };
    });
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
