import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
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
export class ScatterChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() points: ScatterPoint[] = [];
  @Input() xSuffix = '';
  @Input() ySuffix = '';

  @ViewChild('wrapEl', { static: true }) wrapRef!: ElementRef<HTMLDivElement>;

  // Matched to the wrapper's real rendered size via ResizeObserver so 1 SVG unit
  // always equals 1 real pixel — text never scales down into illegibility, and
  // the chart never has to overflow or scroll to stay at native size.
  VW = 600;
  VH = 280;
  readonly PAD = { top: 16, right: 20, bottom: 34, left: 44 };

  private resizeObserver?: ResizeObserver;

  get cw(): number { return this.VW - this.PAD.left - this.PAD.right; }
  get ch(): number { return this.VH - this.PAD.top - this.PAD.bottom; }
  get yBottom(): number { return this.PAD.top + this.ch; }

  xGrid: GridLine[] = [];
  yGrid: GridLine[] = [];
  rendered: RenderedPoint[] = [];
  hovered: RenderedPoint | null = null;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        if (width < 1 || height < 1) return;
        if (Math.abs(width - this.VW) < 0.5 && Math.abs(height - this.VH) < 0.5) return;
        this.zone.run(() => {
          this.VW = width;
          this.VH = height;
          this.build();
        });
      });
      this.resizeObserver.observe(this.wrapRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  ngOnChanges(): void {
    this.hovered = null;
    this.build();
  }

  private build(): void {
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
