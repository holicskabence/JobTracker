import { Component, computed, inject } from '@angular/core';
import { JobStoreService } from '../../services/job-store.service';
import { AuthService } from '../../services/auth.service';
import { AreaChartComponent } from './area-chart/area-chart.component';
import { DonutChartComponent } from './donut-chart/donut-chart.component';

@Component({
  selector: 'app-statistics',
  imports: [AreaChartComponent, DonutChartComponent],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent {
  private readonly store = inject(JobStoreService);
  private readonly auth = inject(AuthService);

  readonly monthlyData = this.store.monthlyStats;
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

  readonly distribution = computed<Partial<Record<string, number>>>(() => {
    const jobs = this.store.jobs();
    const result: Partial<Record<string, number>> = {};
    for (const job of jobs) {
      result[job.status] = (result[job.status] ?? 0) + 1;
    }
    return result;
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
