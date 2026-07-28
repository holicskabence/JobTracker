import { Component, Input, OnChanges } from '@angular/core';
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
}

interface GridLine { y: number; label: string }

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css'
})
export class BarChartComponent implements OnChanges {
  @Input() bars: BarChartBar[] = [];
  @Input() defaultColor = '#5fb9fa';
  @Input() valueSuffix = '';

  readonly VW = 600;
  readonly VH = 280;
  readonly PAD = { top: 16, right: 12, bottom: 34, left: 40 };

  get cw(): number { return this.VW - this.PAD.left - this.PAD.right; }
  get ch(): number { return this.VH - this.PAD.top - this.PAD.bottom; }
  get yBottom(): number { return this.PAD.top + this.ch; }

  gridLines: GridLine[] = [];
  renderedBars: RenderedBar[] = [];
  hoveredIndex: number | null = null;

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

    this.renderedBars = this.bars.map((b, i) => {
      const height = (b.value / yMax) * this.ch;
      return {
        label: b.label,
        value: b.value,
        color: b.color ?? this.defaultColor,
        x: this.PAD.left + i * slot + (slot - barWidth) / 2,
        y: this.yBottom - height,
        width: barWidth,
        height
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
