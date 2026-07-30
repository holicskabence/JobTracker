import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface BarChartBar {
  label: string;
  value: number;
  color?: string;
}

interface RenderedBar {
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  showLabel: boolean;
}

interface GridLine { y: number; label: string }

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css'
})
export class BarChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() bars: BarChartBar[] = [];
  @Input() defaultColor = '#5fb9fa';
  @Input() valueSuffix = '';

  @ViewChild('wrapEl', { static: true }) wrapRef!: ElementRef<HTMLDivElement>;

  // Matched to the wrapper's real rendered size via ResizeObserver so 1 SVG unit
  // always equals 1 real pixel — text never scales down into illegibility, and
  // the chart never has to overflow or scroll to stay at native size.
  VW = 600;
  VH = 280;
  readonly PAD = { top: 16, right: 12, bottom: 34, left: 40 };

  private resizeObserver?: ResizeObserver;

  get cw(): number { return this.VW - this.PAD.left - this.PAD.right; }
  get ch(): number { return this.VH - this.PAD.top - this.PAD.bottom; }
  get yBottom(): number { return this.PAD.top + this.ch; }

  gridLines: GridLine[] = [];
  renderedBars: RenderedBar[] = [];
  hoveredIndex: number | null = null;

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
    this.hoveredIndex = null;
    this.build();
  }

  private build(): void {
    this.gridLines = [];
    this.renderedBars = [];
    if (!this.bars.length) return;

    const maxRaw = Math.max(1, ...this.bars.map(b => b.value));
    const yMax = Math.ceil(maxRaw / 4) * 4 || 1;
    const n = this.bars.length;
    const slot = this.cw / n;
    const barWidth = Math.min(46, slot * 0.55);

    // Below this per-bar slot width, labels start to collide — thin them out
    // (every Nth) instead of letting them overlap into an unreadable smear.
    const minLabelSlot = 42;
    const labelStride = slot < minLabelSlot ? Math.ceil(minLabelSlot / slot) : 1;

    this.renderedBars = this.bars.map((b, i) => {
      const height = (b.value / yMax) * this.ch;
      return {
        label: b.label,
        value: b.value,
        color: b.color ?? this.defaultColor,
        x: this.PAD.left + i * slot + (slot - barWidth) / 2,
        y: this.yBottom - height,
        width: barWidth,
        height,
        showLabel: i % labelStride === 0
      };
    });

    const ticks = 4;
    this.gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = Math.round((i / ticks) * yMax);
      return { y: this.yBottom - (v / yMax) * this.ch, label: String(v) };
    });
  }

  onEnter(i: number): void { this.hoveredIndex = i; }
  onLeave(): void { this.hoveredIndex = null; }

  tooltipX(bar: RenderedBar): number {
    const w = 88;
    const minX = this.PAD.left;
    const maxX = this.VW - this.PAD.right - w;
    return Math.max(minX, Math.min(maxX, bar.x + bar.width / 2 - w / 2));
  }
}
