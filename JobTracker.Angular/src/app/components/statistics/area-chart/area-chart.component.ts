import { Component, ElementRef, Input, OnChanges } from '@angular/core';
import { gsap } from 'gsap';
import { MonthlyStatsPoint } from '../../../models/job.model';

interface ChartPoint { x: number; y: number }
interface GridLine { y: number; label: string }
interface XLabel { x: number; text: string }

export interface HoveredCol {
  idx: number;
  x: number;
  sub: number;
  cb: number;
  month: string;
}

@Component({
  selector: 'app-area-chart',
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.css'
})
export class AreaChartComponent implements OnChanges {
  @Input() data: MonthlyStatsPoint[] = [];

  readonly VW = 600;
  readonly VH = 280;
  readonly PAD = { top: 20, right: 20, bottom: 48, left: 44 };

  get cw(): number { return this.VW - this.PAD.left - this.PAD.right; }
  get ch(): number { return this.VH - this.PAD.top - this.PAD.bottom; }
  get x0(): number { return this.PAD.left; }
  get y0(): number { return this.PAD.top; }
  get yBottom(): number { return this.PAD.top + this.ch; }

  submittedPath = '';
  callbacksPath = '';
  areaPath = '';
  gridLines: GridLine[] = [];
  xLabels: XLabel[] = [];
  subPoints: ChartPoint[] = [];
  cbPoints: ChartPoint[] = [];
  colHalfWidth = 0;

  hovered: HoveredCol | null = null;

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnChanges(): void {
    this.hovered = null;
    this.build();
  }

  private build(): void {
    if (!this.data.length) return;

    const maxRaw = Math.max(...this.data.flatMap(d => [d.submitted, d.callbacks]));
    const yMax = Math.ceil(maxRaw / 2) * 2 + 2;
    const step = this.data.length > 1 ? this.cw / (this.data.length - 1) : this.cw;
    this.colHalfWidth = step / 2;

    const px = (i: number) => this.x0 + i * step;
    const py = (v: number) => this.y0 + this.ch - (v / yMax) * this.ch;

    this.subPoints = this.data.map((d, i) => ({ x: px(i), y: py(d.submitted) }));
    this.cbPoints = this.data.map((d, i) => ({ x: px(i), y: py(d.callbacks) }));

    this.submittedPath = this.linePath(this.subPoints);
    this.callbacksPath = this.linePath(this.cbPoints);

    const last = this.subPoints[this.subPoints.length - 1];
    const first = this.subPoints[0];
    this.areaPath =
      `${this.submittedPath} L ${last.x.toFixed(1)} ${this.yBottom} L ${first.x.toFixed(1)} ${this.yBottom} Z`;

    const ticks = 4;
    this.gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = Math.round((i / ticks) * yMax);
      return { y: py(v), label: String(v) };
    });

    this.xLabels = this.data.map((d, i) => ({ x: px(i), text: d.month }));
  }

  private linePath(pts: ChartPoint[]): string {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  onColEnter(i: number): void {
    const svg = this.el.nativeElement.querySelector('.chart-svg')!;
    const subDot = svg.querySelectorAll<SVGCircleElement>('.dot--sub')[i];
    const cbDot = svg.querySelectorAll<SVGCircleElement>('.dot--cb')[i];

    if (subDot) gsap.to(subDot, { attr: { r: 8 }, duration: 0.2, ease: 'back.out(2)' });
    if (cbDot) gsap.to(cbDot, { attr: { r: 7 }, duration: 0.2, ease: 'back.out(2)', delay: 0.04 });

    this.hovered = {
      idx: i,
      x: this.xLabels[i].x,
      sub: this.data[i].submitted,
      cb: this.data[i].callbacks,
      month: this.data[i].month
    };

    const tip = svg.querySelector<SVGGElement>('.chart-tooltip');
    if (tip) gsap.fromTo(tip, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' });
  }

  onColLeave(): void {
    const svg = this.el.nativeElement.querySelector('.chart-svg')!;
    gsap.to(svg.querySelectorAll('.dot--sub'), { attr: { r: 5 }, duration: 0.18, ease: 'power2.out' });
    gsap.to(svg.querySelectorAll('.dot--cb'), { attr: { r: 4 }, duration: 0.18, ease: 'power2.out' });

    const tip = svg.querySelector<SVGGElement>('.chart-tooltip');
    if (tip) {
      gsap.to(tip, {
        opacity: 0, y: -4, duration: 0.14, ease: 'power2.in',
        onComplete: () => { this.hovered = null; }
      });
    } else {
      this.hovered = null;
    }
  }

  tooltipCenterX(x: number): number {
    const w = 104;
    const minX = this.x0 + w / 2;
    const maxX = this.VW - this.PAD.right - w / 2;
    return Math.max(minX, Math.min(maxX, x));
  }

  tooltipX(x: number): number {
    return this.tooltipCenterX(x) - 52;
  }
}
