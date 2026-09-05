import {
  AfterViewInit, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, ViewChild
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface ComboChartItem {
  label: string;
  barValue: number;
  lineValue: number;
  best?: boolean;
}

interface RenderedBar {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  best: boolean;
}

interface AxisTick { y: number; label: string }

@Component({
  selector: 'app-combo-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './combo-chart.component.html',
  styleUrl: './combo-chart.component.css'
})
export class ComboChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() items: ComboChartItem[] = [];
  @Input() barColor = '#5fb9fa';
  @Input() lineColor = '#26ac00';
  @Input() barLegendLabel = '';
  @Input() lineLegendLabel = '';
  @Input() lineSuffix = '%';
  @Input() bestBadgeLabel = '';

  @ViewChild('wrapElement', { static: true }) wrapRef!: ElementRef<HTMLDivElement>;

  viewWidth = 600;
  viewHeight = 240;

  readonly padTop = 36;
  readonly padRight = 42;
  readonly padBottom = 32;
  readonly padLeft = 34;

  private resizeObserver?: ResizeObserver;

  get chartWidth(): number { return this.viewWidth - this.padLeft - this.padRight; }
  get chartHeight(): number { return this.viewHeight - this.padTop - this.padBottom; }
  get chartBottom(): number { return this.padTop + this.chartHeight; }

  leftTicks: AxisTick[] = [];
  rightTicks: AxisTick[] = [];
  renderedBars: RenderedBar[] = [];
  linePath = '';
  linePoints: { x: number; y: number }[] = [];
  badge: { x: number; y: number } | null = null;
  hoveredIndex: number | null = null;

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
    this.hoveredIndex = null;
    this.build();
  }

  private build(): void {
    this.leftTicks = [];
    this.rightTicks = [];
    this.renderedBars = [];
    this.linePoints = [];
    this.linePath = '';
    this.badge = null;

    if (!this.items.length) return;

    const barMax = Math.max(4, Math.ceil(Math.max(...this.items.map(i => i.barValue)) / 4) * 4);
    const lineMax = this.niceMax(Math.max(...this.items.map(i => i.lineValue)));
    const slot = this.chartWidth / this.items.length;
    const barWidth = Math.min(34, slot * 0.42);

    this.renderedBars = this.items.map((item, index) => {
      const height = (item.barValue / barMax) * this.chartHeight;
      const centerX = this.padLeft + index * slot + slot / 2;
      return {
        label: item.label,
        x: centerX - barWidth / 2,
        y: this.chartBottom - height,
        width: barWidth,
        height,
        centerX,
        best: !!item.best
      };
    });

    this.linePoints = this.items.map((item, index) => ({
      x: this.padLeft + index * slot + slot / 2,
      y: this.chartBottom - (item.lineValue / lineMax) * this.chartHeight
    }));
    this.linePath = this.smoothPath(this.linePoints);

    const bestIndex = this.items.findIndex(item => item.best);
    if (bestIndex >= 0 && this.bestBadgeLabel) {
      this.badge = { x: this.renderedBars[bestIndex].centerX, y: 12 };
    }

    const ticks = 4;
    this.leftTicks = Array.from({ length: ticks + 1 }, (_, i) => {
      const value = (i / ticks) * barMax;
      return { y: this.chartBottom - (value / barMax) * this.chartHeight, label: this.formatTick(value) };
    });
    this.rightTicks = Array.from({ length: ticks + 1 }, (_, i) => {
      const value = (i / ticks) * lineMax;
      return { y: this.chartBottom - (value / lineMax) * this.chartHeight, label: this.formatTick(value) + this.lineSuffix };
    });
  }

  private niceMax(rawMax: number): number {
    if (rawMax <= 0) return 4;
    const rounded = Math.pow(10, Math.floor(Math.log10(rawMax)));
    for (const factor of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
      const candidate = rounded * factor;
      if (candidate >= rawMax) return candidate;
    }
    return rounded * 10;
  }

  private formatTick(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  private smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 3) {
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    }
    const clampY = (y: number) => Math.max(this.padTop, Math.min(this.chartBottom, y));
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

  onColumnEnter(index: number): void { this.hoveredIndex = index; }
  onColumnLeave(): void { this.hoveredIndex = null; }

  columnX(index: number): number {
    return this.padLeft + index * (this.chartWidth / this.items.length);
  }

  get columnWidth(): number {
    return this.items.length ? this.chartWidth / this.items.length : 0;
  }

  tooltipX(index: number): number {
    const width = 108;
    const center = this.renderedBars[index].centerX;
    return Math.max(this.padLeft, Math.min(this.viewWidth - this.padRight - width, center - width / 2));
  }
}
