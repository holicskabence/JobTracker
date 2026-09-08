import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-area-chart-graphic',
  standalone: true,
  templateUrl: './area-chart-graphic.component.html',
  styleUrl: './area-chart-graphic.component.css'
})
export class AreaChartGraphicComponent {
  @Input({ required: true }) gradientId!: string;
  @Input({ required: true }) color!: string;
  @Input({ required: true }) linePath!: string;

  get areaPath(): string {
    return `${this.linePath} L228 92 L12 92 Z`;
  }

  get areaFill(): string {
    return `url(#${this.gradientId})`;
  }
}
