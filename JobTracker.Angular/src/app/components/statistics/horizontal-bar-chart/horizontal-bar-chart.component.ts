import { Component, Input, OnChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface HBarItem {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-horizontal-bar-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './horizontal-bar-chart.component.html',
  styleUrl: './horizontal-bar-chart.component.css'
})
export class HorizontalBarChartComponent implements OnChanges {
  @Input() items: HBarItem[] = [];
  @Input() valueSuffix = '';

  sorted: HBarItem[] = [];
  maxValue = 1;

  ngOnChanges(): void {
    this.sorted = [...this.items].sort((a, b) => b.value - a.value);
    this.maxValue = Math.max(1, ...this.sorted.map(i => i.value));
  }

  widthPct(value: number): number {
    return this.maxValue > 0 ? Math.max(2, (value / this.maxValue) * 100) : 0;
  }
}
