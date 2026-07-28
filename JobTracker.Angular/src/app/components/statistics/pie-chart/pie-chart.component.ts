import { Component, Input, OnChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface PieChartSlice {
  label: string;
  value: number;
  color: string;
}

interface RenderedSlice extends PieChartSlice {
  path: string;
  percent: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.css'
})
export class PieChartComponent implements OnChanges {
  @Input() slices: PieChartSlice[] = [];

  readonly CX = 100;
  readonly CY = 100;
  readonly R = 84;
  readonly GAP_DEG = 2.5;

  rendered: RenderedSlice[] = [];
  hoveredLabel: string | null = null;

  ngOnChanges(): void {
    this.hoveredLabel = null;
    const nonZero = this.slices.filter(s => s.value > 0);
    const sum = nonZero.reduce((s, v) => s + v.value, 0);
    if (!sum) { this.rendered = []; return; }

    const gapTotal = nonZero.length * this.GAP_DEG;
    const available = 360 - gapTotal;
    let angle = -90;

    this.rendered = nonZero.map(s => {
      const sweep = (s.value / sum) * available;
      const startDeg = angle + this.GAP_DEG / 2;
      const endDeg = startDeg + sweep;
      angle = endDeg + this.GAP_DEG / 2;
      return { ...s, path: this.arc(startDeg, endDeg), percent: Math.round((s.value / sum) * 100) };
    });
  }

  hover(label: string): void { this.hoveredLabel = label; }
  clearHover(): void { this.hoveredLabel = null; }

  private arc(startDeg: number, endDeg: number): string {
    const toR = (d: number) => (d * Math.PI) / 180;
    const cos = (d: number) => Math.cos(toR(d));
    const sin = (d: number) => Math.sin(toR(d));

    const x1 = this.CX + this.R * cos(startDeg);
    const y1 = this.CY + this.R * sin(startDeg);
    const x2 = this.CX + this.R * cos(endDeg);
    const y2 = this.CY + this.R * sin(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const f = (n: number) => n.toFixed(3);

    return [
      `M ${this.CX} ${this.CY}`,
      `L ${f(x1)} ${f(y1)}`,
      `A ${this.R} ${this.R} 0 ${large} 1 ${f(x2)} ${f(y2)}`,
      'Z'
    ].join(' ');
  }
}
