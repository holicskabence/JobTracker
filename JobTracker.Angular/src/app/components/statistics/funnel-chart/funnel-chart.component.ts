import { Component, Input, OnChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface RenderedStage extends FunnelStage {
  widthPct: number;
  conversionFromPrev: number | null;
  conversionFromFirst: number;
}

@Component({
  selector: 'app-funnel-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule],
  templateUrl: './funnel-chart.component.html',
  styleUrl: './funnel-chart.component.css'
})
export class FunnelChartComponent implements OnChanges {
  @Input() stages: FunnelStage[] = [];

  rendered: RenderedStage[] = [];

  ngOnChanges(): void {
    if (!this.stages.length) { this.rendered = []; return; }
    const first = this.stages[0].value || 1;
    this.rendered = this.stages.map((s, i) => ({
      ...s,
      widthPct: Math.max(6, (s.value / first) * 100),
      conversionFromPrev: i === 0 ? null : (this.stages[i - 1].value > 0 ? Math.round((s.value / this.stages[i - 1].value) * 100) : 0),
      conversionFromFirst: first > 0 ? Math.round((s.value / first) * 100) : 0
    }));
  }
}
