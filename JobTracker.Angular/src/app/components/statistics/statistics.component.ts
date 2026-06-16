import { Component, computed, effect, inject, signal } from '@angular/core';
import { JobStoreService } from '../../services/job-store.service';
import { AuthService } from '../../services/auth.service';
import { AreaChartComponent, ChartSeriesInput } from './area-chart/area-chart.component';
import { DonutChartComponent } from './donut-chart/donut-chart.component';
import { CardComponent } from '../shared/card/card.component';
import { BadgeComponent } from '../shared/badge/badge.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { StatsGranularity } from '../../models/job.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [AreaChartComponent, DonutChartComponent, CardComponent, BadgeComponent, EmptyStateComponent],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent {
  private readonly store = inject(JobStoreService);
  private readonly auth = inject(AuthService);

  readonly statusConfigs = this.store.statusConfigs;
  readonly granularity = signal<StatsGranularity>('day');
  readonly selectedMetrics = signal<string[]>([]);

  readonly chartCategories = computed(() => {
    const g = this.granularity();
    return this.store.statsSeries().map(p => this.formatPeriod(p.period, g));
  });

  readonly chartSeries = computed<ChartSeriesInput[]>(() => {
    const data = this.store.statsSeries();
    const configs = this.statusConfigs();
    return this.selectedMetrics()
      .map(key => {
        const cfg = configs.find(c => c.key === key);
        if (!cfg) return null;
        return {
          key,
          label: cfg.label,
          color: cfg.color,
          values: data.map(p => p.counts[key] ?? 0)
        };
      })
      .filter((s): s is ChartSeriesInput => s !== null);
  });

  constructor() {
    effect(() => {
      const configs = this.statusConfigs();
      if (configs.length && this.selectedMetrics().length === 0) {
        const defaults = ['Beadva', 'Visszahivas'].filter(k => configs.some(c => c.key === k));
        this.selectedMetrics.set(defaults.length ? defaults : configs.slice(0, 2).map(c => c.key));
      }
    }, { allowSignalWrites: true });
  }

  setGranularity(g: StatsGranularity): void {
    if (this.granularity() === g) return;
    this.granularity.set(g);
    this.store.loadStatsSeries(g);
  }

  toggleMetric(key: string): void {
    this.selectedMetrics.update(prev => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter(k => k !== key) : prev;
      }
      return [...prev, key];
    });
  }

  isMetricSelected(key: string): boolean {
    return this.selectedMetrics().includes(key);
  }

  private formatPeriod(period: string, granularity: StatsGranularity): string {
    switch (granularity) {
      case 'day': {
        const [, m, d] = period.split('-');
        return `${m}.${d}.`;
      }
      case 'week': {
        const week = period.split('-W')[1];
        return `${week}. hét`;
      }
      default:
        return new Date(period + '-01').toLocaleDateString('hu-HU', { month: 'short' });
    }
  }

  readonly stats = this.store.stats;
  readonly total = computed(() => this.store.jobs().length);
  readonly goal = computed(() => this.auth.currentUser()?.goal ?? 50);

  readonly goalProgress = computed(() =>
    Math.min(Math.round((this.total() / this.goal()) * 100), 100)
  );

  readonly callbackRate = computed(() => {
    const t = this.total();
    return t > 0 ? Math.round((this.stats().callbacks / t) * 100) : 0;
  });

  readonly rejectionRate = computed(() => {
    const t = this.total();
    return t > 0 ? Math.round((this.stats().rejections / t) * 100) : 0;
  });

  readonly weekdayDistribution = computed(() => {
    const labels = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const counts = new Array(7).fill(0);
    for (const job of this.store.jobs()) {
      const dow = (new Date(job.date).getDay() + 6) % 7;
      counts[dow]++;
    }
    const max = Math.max(1, ...counts);
    return labels.map((name, i) => ({ name, count: counts[i], pct: Math.round((counts[i] / max) * 100) }));
  });

  readonly funnel = computed(() => {
    const jobs = this.store.jobs();
    const total = jobs.length;
    return this.store.statusConfigs().map(cfg => ({
      key: cfg.key,
      label: cfg.label,
      color: cfg.color,
      count: jobs.filter(j => j.status === cfg.key).length,
      percent: total > 0
        ? Math.round((jobs.filter(j => j.status === cfg.key).length / total) * 100)
        : 0
    }));
  });

  readonly funnelMax = computed(() =>
    Math.max(1, ...this.funnel().map(f => f.count))
  );

  readonly topCompanies = computed(() => {
    const map = new Map<string, number>();
    for (const job of this.store.jobs()) {
      map.set(job.company, (map.get(job.company) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({ rank: i + 1, name, count }));
  });

  readonly pendingCount = computed(() =>
    this.store.jobs().filter(j => j.status === 'Beadva').length
  );
}
