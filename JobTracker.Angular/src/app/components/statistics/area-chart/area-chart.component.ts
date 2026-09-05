import {
  AfterViewInit, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, ViewChild
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

interface ChartPoint { x: number; y: number; value: number }
interface GridLine { y: number; label: string }
interface XLabel { x: number; text: string; anchor: string }

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

export interface HoveredColumn {
  index: number;
  x: number;
  label: string;
  rows: { key: string; label: string; color: string; value: string }[];
}

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.css'
})
export class AreaChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() categories: string[] = [];
  @Input() series: ChartSeriesInput[] = [];
  @Input() smooth = false;
  @Input() showDots = true;
  @Input() showLegend = true;
  @Input() showPointLabels = false;
  @Input() showArea = true;
  @Input() valueSuffix = '';
  @Input() decimals = 0;
  @Input() maxXLabels = 8;
  @Input() emptyMessage = 'statistics.emptyState.noApplications';

  @ViewChild('wrapElement', { static: true }) wrapRef!: ElementRef<HTMLDivElement>;

  // The SVG viewBox is matched to the wrapper's real pixel size so 1 SVG unit is
  // 1 device pixel: axis labels stay legible instead of scaling with the card.
  viewWidth = 600;
  viewHeight = 260;
  readonly tooltipWidth = 132;

  private resizeObserver?: ResizeObserver;

  get padTop(): number { return this.showPointLabels ? 30 : 18; }
  get padRight(): number { return 18; }
  get padBottom(): number { return 34; }
  get padLeft(): number { return 40; }

  get chartWidth(): number { return this.viewWidth - this.padLeft - this.padRight; }
  get chartHeight(): number { return this.viewHeight - this.padTop - this.padBottom; }
  get chartTop(): number { return this.padTop; }
  get chartBottom(): number { return this.padTop + this.chartHeight; }

  gridLines: GridLine[] = [];
  xLabels: XLabel[] = [];
  columnPositions: number[] = [];
  seriesLines: SeriesLine[] = [];
  columnHalfWidth = 0;
  hovered: HoveredColumn | null = null;

  constructor(private readonly zone: NgZone) { }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        if (width < 1 || height < 1) return;
        if (Math.abs(width - this.viewWidth) < 0.5 && Math.abs(height - this.viewHeight) < 0.5) return;
        this.zone.run(() => {
          this.viewWidth = width;
          this.viewHeight = height;
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

  formatValue(value: number): string {
    return value.toFixed(this.decimals) + this.valueSuffix;
  }

  private build(): void {
    this.gridLines = [];
    this.xLabels = [];
    this.columnPositions = [];
    this.seriesLines = [];

    if (!this.categories.length || !this.series.length) return;

    const count = this.categories.length;
    const rawMax = Math.max(...this.series.flatMap(s => s.values), 0);
    const yMax = this.axisMax(rawMax);
    const step = count > 1 ? this.chartWidth / (count - 1) : this.chartWidth;
    this.columnHalfWidth = count > 1 ? step / 2 : this.chartWidth / 2;

    const toX = (index: number) => this.padLeft + index * step;
    const toY = (value: number) => this.chartTop + this.chartHeight - (value / yMax) * this.chartHeight;

    this.columnPositions = this.categories.map((_, index) => toX(index));

    this.seriesLines = this.series.map(s => {
      const points = s.values.map((value, index) => ({ x: toX(index), y: toY(value), value }));
      const path = this.smooth ? this.smoothPath(points) : this.straightPath(points);
      const first = points[0];
      const last = points[points.length - 1];
      const areaPath = `${path} L ${last.x.toFixed(1)} ${this.chartBottom} L ${first.x.toFixed(1)} ${this.chartBottom} Z`;
      return { key: s.key, label: s.label, color: s.color, path, areaPath, points, values: s.values };
    });

    const ticks = 4;
    this.gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const value = (i / ticks) * yMax;
      return { y: toY(value), label: this.formatTick(value) };
    });

    const stride = Math.max(1, Math.ceil(count / this.maxXLabels));
    const shown = this.categories.map((text, index) => ({ text, index })).filter(item => item.index % stride === 0);
    const last = count - 1;
    // The final tick is worth showing, but not on top of the previous one.
    if (last - shown[shown.length - 1].index >= stride / 2) shown.push({ text: this.categories[last], index: last });
    // Edge labels hug the plot edges so they cannot spill past the card padding.
    this.xLabels = shown.map((item, position) => ({
      x: toX(item.index),
      text: item.text,
      anchor: item.index === 0 ? 'start' : position === shown.length - 1 && item.index === count - 1 ? 'end' : 'middle'
    }));
  }

  /** Four evenly spaced, round ticks read better than a tight fit to the maximum. */
  private axisMax(rawMax: number): number {
    return Math.max(4, Math.ceil(rawMax / 4) * 4);
  }

  private formatTick(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  private straightPath(points: ChartPoint[]): string {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  // Catmull-Rom control points converted to cubic Béziers, clamped to the plot
  // area so a steep dip never bulges below the baseline.
  private smoothPath(points: ChartPoint[]): string {
    if (points.length < 3) return this.straightPath(points);
    const clampY = (y: number) => Math.max(this.chartTop, Math.min(this.chartBottom, y));
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const previous = points[i - 1] ?? points[i];
      const current = points[i];
      const next = points[i + 1];
      const following = points[i + 2] ?? next;
      const c1x = current.x + (next.x - previous.x) / 6;
      const c1y = clampY(current.y + (next.y - previous.y) / 6);
      const c2x = next.x - (following.x - current.x) / 6;
      const c2y = clampY(next.y - (following.y - current.y) / 6);
      path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }
    return path;
  }

  tooltipHeight(): number {
    return 22 + (this.hovered?.rows.length ?? 0) * 14;
  }

  onColumnEnter(index: number): void {
    this.hovered = {
      index,
      x: this.columnPositions[index],
      label: this.categories[index],
      rows: this.seriesLines.map(line => ({
        key: line.key,
        label: line.label,
        color: line.color,
        value: this.formatValue(line.values[index])
      }))
    };
  }

  onColumnLeave(): void {
    this.hovered = null;
  }

  tooltipCenterX(x: number): number {
    const half = this.tooltipWidth / 2;
    return Math.max(this.padLeft + half, Math.min(this.viewWidth - this.padRight - half, x));
  }

  tooltipX(x: number): number {
    return this.tooltipCenterX(x) - this.tooltipWidth / 2;
  }
}
