import { Component, Input, OnChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

interface RenderedPoint extends ScatterPoint {
  cx: number;
  cy: number;
}

interface GridLine { pos: number; label: string }

@Component({
  selector: 'app-scatter-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './scatter-chart.component.html',
  styleUrl: './scatter-chart.component.css'
})
export class ScatterChartComponent implements OnChanges {
  @Input() points: ScatterPoint[] = [];
  @Input() xSuffix = '';
  @Input() ySuffix = '';

  readonly VW = 600;
  readonly VH = 280;
  readonly PAD = { top: 16, right: 20, bottom: 34, left: 44 };

  get cw(): number { return this.VW - this.PAD.left - this.PAD.right; }
  get ch(): number { return this.VH - this.PAD.top - this.PAD.bottom; }
  get yBottom(): number { return this.PAD.top + this.ch; }

  xGrid: GridLine[] = [];
  yGrid: GridLine[] = [];
  rendered: RenderedPoint[] = [];
  hovered: RenderedPoint | null = null;

  ngOnChanges(): void {
    this.hovered = null;
    this.xGrid = [];
    this.yGrid = [];
    this.rendered = [];
    if (!this.points.length) return;

    const xMax = Math.ceil(Math.max(1, ...this.points.map(p => p.x)) * 1.1);
    const yMax = Math.ceil(Math.max(1, ...this.points.map(p => p.y)) * 1.15);

    const px = (v: number) => this.PAD.left + (v / xMax) * this.cw;
    const py = (v: number) => this.yBottom - (v / yMax) * this.ch;

    this.rendered = this.points.map(p => ({ ...p, cx: px(p.x), cy: py(p.y) }));

    const ticks = 4;
    this.xGrid = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = Math.round((i / ticks) * xMax);
      return { pos: px(v), label: String(v) };
    });
    this.yGrid = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = Math.round((i / ticks) * yMax);
      return { pos: py(v), label: String(v) };
    });
  }

  onEnter(p: RenderedPoint): void { this.hovered = p; }
  onLeave(): void { this.hovered = null; }

  tooltipX(p: RenderedPoint): number {
    const w = 110;
    return Math.max(this.PAD.left, Math.min(this.VW - this.PAD.right - w, p.cx - w / 2));
  }
}
