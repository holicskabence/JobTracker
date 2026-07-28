import { Component, Input, OnChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface RadarAxis {
  label: string;
  value: number;
}

interface AxisPoint {
  label: string;
  value: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
}

@Component({
  selector: 'app-radar-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './radar-chart.component.html',
  styleUrl: './radar-chart.component.css'
})
export class RadarChartComponent implements OnChanges {
  @Input() axes: RadarAxis[] = [];
  @Input() max = 100;
  @Input() color = '#5fb9fa';

  readonly CX = 140;
  readonly CY = 130;
  readonly R = 96;

  rings = [0.25, 0.5, 0.75, 1];
  ringPaths: string[] = [];
  axisLines: { x2: number; y2: number }[] = [];
  areaPath = '';
  points: { x: number; y: number }[] = [];
  axisPoints: AxisPoint[] = [];

  ngOnChanges(): void {
    const n = this.axes.length;
    if (!n) { this.ringPaths = []; this.axisLines = []; this.areaPath = ''; this.points = []; this.axisPoints = []; return; }

    const angleFor = (i: number) => -90 + (i / n) * 360;
    const coord = (i: number, r: number) => {
      const rad = (angleFor(i) * Math.PI) / 180;
      return { x: this.CX + r * Math.cos(rad), y: this.CY + r * Math.sin(rad) };
    };

    this.ringPaths = this.rings.map(frac => {
      const pts = Array.from({ length: n }, (_, i) => coord(i, this.R * frac));
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
    });

    this.axisLines = Array.from({ length: n }, (_, i) => {
      const p = coord(i, this.R);
      return { x2: p.x, y2: p.y };
    });

    this.points = this.axes.map((a, i) => coord(i, (Math.min(a.value, this.max) / this.max) * this.R));
    this.areaPath = this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

    this.axisPoints = this.axes.map((a, i) => {
      const labelPt = coord(i, this.R + 22);
      const angle = angleFor(i);
      const norm = ((angle % 360) + 360) % 360;
      let anchor: 'start' | 'middle' | 'end' = 'middle';
      if (norm > 100 && norm < 260) anchor = 'end';
      else if (norm < 80 || norm > 280) anchor = 'start';
      return { label: a.label, value: a.value, labelX: labelPt.x, labelY: labelPt.y, anchor };
    });
  }
}
