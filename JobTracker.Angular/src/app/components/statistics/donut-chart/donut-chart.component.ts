import { Component, Input, OnChanges, signal } from '@angular/core';

export interface DonutSliceInput {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface DonutSlice extends DonutSliceInput {
  percent: number;
  path: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.css'
})
export class DonutChartComponent implements OnChanges {
  @Input() slices: DonutSliceInput[] = [];
  @Input() centerLabel = '';

  readonly CENTER = 100;
  readonly OUTER_RADIUS = 76;
  readonly INNER_RADIUS = 52;
  readonly GAP_DEGREES = 3;

  readonly hoveredKey = signal<string | null>(null);

  renderedSlices: DonutSlice[] = [];
  total = 0;

  ngOnChanges(): void {
    this.hoveredKey.set(null);
    this.build();
  }

  private build(): void {
    const positive = this.slices.filter(slice => slice.value > 0);
    this.total = positive.reduce((sum, slice) => sum + slice.value, 0);
    if (this.total === 0) {
      this.renderedSlices = [];
      return;
    }

    const available = 360 - positive.length * this.GAP_DEGREES;
    let cursor = -90;

    this.renderedSlices = positive.map(slice => {
      const sweep = (slice.value / this.total) * available;
      const start = cursor + this.GAP_DEGREES / 2;
      const end = start + sweep;
      cursor = end + this.GAP_DEGREES / 2;
      return {
        ...slice,
        percent: Math.round((slice.value / this.total) * 1000) / 10,
        path: this.arc(start, end)
      };
    });
  }

  get centerValue(): string {
    const hovered = this.renderedSlices.find(slice => slice.key === this.hoveredKey());
    return hovered ? String(hovered.value) : String(this.total);
  }

  get centerCaption(): string {
    const hovered = this.renderedSlices.find(slice => slice.key === this.hoveredKey());
    return hovered ? hovered.label : this.centerLabel;
  }

  hoverSlice(key: string): void { this.hoveredKey.set(key); }
  clearHover(): void { this.hoveredKey.set(null); }

  private arc(startDegrees: number, endDegrees: number): string {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const cos = (degrees: number) => Math.cos(toRadians(degrees));
    const sin = (degrees: number) => Math.sin(toRadians(degrees));

    const x1 = this.CENTER + this.OUTER_RADIUS * cos(startDegrees);
    const y1 = this.CENTER + this.OUTER_RADIUS * sin(startDegrees);
    const x2 = this.CENTER + this.OUTER_RADIUS * cos(endDegrees);
    const y2 = this.CENTER + this.OUTER_RADIUS * sin(endDegrees);
    const x3 = this.CENTER + this.INNER_RADIUS * cos(endDegrees);
    const y3 = this.CENTER + this.INNER_RADIUS * sin(endDegrees);
    const x4 = this.CENTER + this.INNER_RADIUS * cos(startDegrees);
    const y4 = this.CENTER + this.INNER_RADIUS * sin(startDegrees);
    const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;

    const format = (value: number) => value.toFixed(3);
    return [
      `M ${format(x1)} ${format(y1)}`,
      `A ${this.OUTER_RADIUS} ${this.OUTER_RADIUS} 0 ${largeArc} 1 ${format(x2)} ${format(y2)}`,
      `L ${format(x3)} ${format(y3)}`,
      `A ${this.INNER_RADIUS} ${this.INNER_RADIUS} 0 ${largeArc} 0 ${format(x4)} ${format(y4)}`,
      'Z'
    ].join(' ');
  }
}
