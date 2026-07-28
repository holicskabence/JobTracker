import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-gauge-chart',
  standalone: true,
  templateUrl: './gauge-chart.component.html',
  styleUrl: './gauge-chart.component.css'
})
export class GaugeChartComponent implements OnChanges {
  @Input() value = 0;
  @Input() label = '';

  readonly CX = 110;
  readonly CY = 110;
  readonly R = 84;

  trackPath = '';
  valuePath = '';
  needleAngle = -90;
  color = '#ef4444';

  ngOnChanges(): void {
    const clamped = Math.max(0, Math.min(100, this.value));
    this.trackPath = this.arcPath(-180, 0);
    const endAngle = -180 + (clamped / 100) * 180;
    this.valuePath = this.arcPath(-180, endAngle);
    this.needleAngle = endAngle;
    this.color = clamped >= 75 ? '#26ac00' : clamped >= 50 ? '#5fb9fa' : clamped >= 25 ? '#f59e0b' : '#ef4444';
  }

  private arcPath(startDeg: number, endDeg: number): string {
    const toR = (d: number) => (d * Math.PI) / 180;
    const point = (d: number) => ({
      x: this.CX + this.R * Math.cos(toR(d)),
      y: this.CY + this.R * Math.sin(toR(d))
    });
    const p1 = point(startDeg);
    const p2 = point(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const f = (n: number) => n.toFixed(2);
    return `M ${f(p1.x)} ${f(p1.y)} A ${this.R} ${this.R} 0 ${large} 1 ${f(p2.x)} ${f(p2.y)}`;
  }
}
