import { Component, Input, OnChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface HBarItem {
  label: string;
  value: number;
  color: string;
}

interface RenderedHBarItem extends HBarItem {
  percent: number;
  widthPercent: number;
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
  @Input() showPercent = false;

  rows: RenderedHBarItem[] = [];

  ngOnChanges(): void {
    const sorted = [...this.items].filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    const max = Math.max(1, ...sorted.map(item => item.value));
    const total = sorted.reduce((sum, item) => sum + item.value, 0);

    this.rows = sorted.map(item => ({
      ...item,
      percent: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
      widthPercent: Math.max(3, (item.value / max) * 100)
    }));
  }
}
