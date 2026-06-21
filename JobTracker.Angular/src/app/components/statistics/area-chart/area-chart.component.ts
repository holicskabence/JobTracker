import { Component, ElementRef, Input, OnChanges } from '@angular/core';
import { gsap } from 'gsap';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

interface ChartPoint { x: number; y: number }
interface GridLine { y: number; label: string }
interface XLabel { x: number; text: string }
interface ColPosition { x: number }

interface SeriesLine {
  key: string;
  label: string;
  color: string;
  path: string;
  areaPath: string;
  points: ChartPoint[];
  values: number[];
}

export interface ChartSeriesInput {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export interface HoveredCol {
  idx: number;
  x: number;
  label: string;
  rows: { key: string; label: string; color: string; value: number }[];
}

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.css'
})
export class AreaChartComponent implements OnChanges {
  @Input() categories: string[] = [];
  @Input() series: ChartSeriesInput[] = [];

  readonly VW = 600;
  readonly VH = 280;
  readonly PAD = { top: 20, right: 20, bottom: 48, left: 44 };
  readonly tooltipW = 124;

  get cw(): number { return this.VW - this.PAD.left - this.PAD.right; }
  get ch(): number { return this.VH - this.PAD.top - this.PAD.bottom; }
  get x0(): number { return this.PAD.left; }
  get y0(): number { return this.PAD.top; }
  get yBottom(): number { return this.PAD.top + this.ch; }

  gridLines: GridLine[] = [];
  xLabels: XLabel[] = [];
  colPositions: ColPosition[] = [];
  seriesLines: SeriesLine[] = [];
  colHalfWidth = 0;

  hovered: HoveredCol | null = null;

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnChanges(): void {
    this.hovered = null;
    this.build();
  }

  private build(): void {
    this.gridLines = [];
    this.xLabels = [];
    this.colPositions = [];
    this.seriesLines = [];

    if (!this.categories.length || !this.series.length) return;

    const n = this.categories.length;
    const maxRaw = Math.max(1, ...this.series.flatMap(s => s.values));
    const yMax = Math.ceil(maxRaw / 2) * 2 + 2;
    const step = n > 1 ? this.cw / (n - 1) : this.cw;
    this.colHalfWidth = step / 2;

    const px = (i: number) => this.x0 + i * step;
    const py = (v: number) => this.y0 + this.ch - (v / yMax) * this.ch;

    this.colPositions = this.categories.map((_, i) => ({ x: px(i) }));

    this.seriesLines = this.series.map(s => {
      const points = s.values.map((v, i) => ({ x: px(i), y: py(v) }));
      const path = this.linePath(points);
      const first = points[0];
      const last = points[points.length - 1];
      const areaPath = `${path} L ${last.x.toFixed(1)} ${this.yBottom} L ${first.x.toFixed(1)} ${this.yBottom} Z`;
      return { key: s.key, label: s.label, color: s.color, path, areaPath, points, values: s.values };
    });

    const ticks = 4;
    this.gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = Math.round((i / ticks) * yMax);
      return { y: py(v), label: String(v) };
    });

    const labelStep = Math.max(1, Math.ceil(n / 10));
    this.xLabels = this.categories
      .map((text, i) => ({ x: px(i), text, i }))
      .filter(lbl => lbl.i % labelStep === 0)
      .map(({ x, text }) => ({ x, text }));
  }

  private linePath(pts: ChartPoint[]): string {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  tooltipHeight(): number {
    return 22 + (this.hovered?.rows.length ?? 0) * 13;
  }

  onColEnter(i: number): void {
    const svg = this.el.nativeElement.querySelector('.chart-svg')!;
    const dots = svg.querySelectorAll<SVGCircleElement>(`.dot[data-col="${i}"]`);
    gsap.to(dots, { attr: { r: 6 }, duration: 0.2, ease: 'back.out(2)' });

    this.hovered = {
      idx: i,
      x: this.colPositions[i].x,
      label: this.categories[i],
      rows: this.seriesLines.map(line => ({
        key: line.key,
        label: line.label,
        color: line.color,
        value: line.values[i]
      }))
    };

    const tip = svg.querySelector<SVGGElement>('.chart-tooltip');
    if (tip) gsap.fromTo(tip, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' });
  }

  onColLeave(): void {
    const svg = this.el.nativeElement.querySelector('.chart-svg')!;
    gsap.to(svg.querySelectorAll('.dot'), { attr: { r: 4 }, duration: 0.18, ease: 'power2.out' });

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
    const w = this.tooltipW;
    const minX = this.x0 + w / 2;
    const maxX = this.VW - this.PAD.right - w / 2;
    return Math.max(minX, Math.min(maxX, x));
  }

  tooltipX(x: number): number {
    return this.tooltipCenterX(x) - this.tooltipW / 2;
  }
}
