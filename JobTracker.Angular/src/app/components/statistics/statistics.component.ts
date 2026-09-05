import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { JobStoreService } from '../../services/job-store.service';
import { JobApiService } from '../../services/job-api.service';
import { Job, JobStatusHistoryEntry } from '../../models/job.model';
import { AreaChartComponent, ChartSeriesInput } from './area-chart/area-chart.component';
import { ComboChartComponent, ComboChartItem } from './combo-chart/combo-chart.component';
import { DonutChartComponent, DonutSliceInput } from './donut-chart/donut-chart.component';
import { HorizontalBarChartComponent, HBarItem } from './horizontal-bar-chart/horizontal-bar-chart.component';
import { FilterDropdownComponent } from './filter-dropdown/filter-dropdown.component';
import { CardComponent } from '../shared/card/card.component';
import { DatePickerComponent } from '../shared/date-picker/date-picker.component';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { StatisticIconComponent, StatisticIconName } from './statistic-icon/statistic-icon.component';

type DateRangeKey = 'all' | 'last30' | 'last90' | 'thisYear' | 'custom';
type Granularity = 'daily' | 'weekly' | 'monthly';

interface KpiDelta {
  text: string;
  icon: StatisticIconName;
  good: boolean;
}

interface KpiCard {
  key: string;
  icon: StatisticIconName;
  accent: string;
  label: string;
  value: string;
  delta: KpiDelta | null;
  note: string;
}

interface PanelNote {
  accent: string;
  icon: StatisticIconName;
  title: string;
  body: string;
}

interface DataInsight {
  key: string;
  title: string;
  body: string;
}

const DAY_MS = 86_400_000;

const SOURCES = ['LinkedIn', 'Company Website', 'Referral', 'NoFluffJobs', 'Profession', 'Other'];
const SOURCE_COLORS = ['#5fb9fa', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#9b9b99'];

const ACCENT_BLUE = '#5fb9fa';
const ACCENT_GREEN = '#26ac00';
const ACCENT_AMBER = '#f59e0b';
const ACCENT_VIOLET = '#8b5cf6';
const ACCENT_TEAL = '#14b8a6';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Bounded by default so every KPI can be compared against the preceding period. */
const DEFAULT_DATE_RANGE: DateRangeKey = 'last90';

function hash(value: string): number {
  let result = 5381;
  for (let i = 0; i < value.length; i++) result = ((result << 5) + result + value.charCodeAt(i)) >>> 0;
  // djb2 alone clusters badly under a small modulo, so mix the bits before bucketing.
  result ^= result >>> 15;
  result = Math.imul(result, 0x85ebca6b) >>> 0;
  return (result ^ (result >>> 13)) >>> 0;
}

function toDate(dateText: string): Date {
  return new Date(dateText.split('T')[0] + 'T00:00:00');
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function monthLabel(date: Date, locale: string): string {
  return `${date.toLocaleDateString(locale, { month: 'short' })} '${String(date.getFullYear()).slice(-2)}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    AreaChartComponent, ComboChartComponent, DonutChartComponent, HorizontalBarChartComponent,
    FilterDropdownComponent, StatisticIconComponent, CardComponent, DatePickerComponent, PageSectionComponent,
    TranslateModule
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  readonly store = inject(JobStoreService);
  private readonly api = inject(JobApiService);
  private readonly translate = inject(TranslateService);

  readonly history = signal<JobStatusHistoryEntry[]>([]);

  /** Mirrors the active language so translation-dependent computeds recompute on a language switch. */
  private readonly language = signal(this.translate.currentLang);

  readonly dateRangeKey = signal<DateRangeKey>(DEFAULT_DATE_RANGE);
  readonly customFrom = signal('');
  readonly customTo = signal('');
  readonly statusFilter = signal<ReadonlySet<string>>(new Set<string>());
  readonly companyFilter = signal('');
  private readonly granularityOverride = signal<Granularity | null>(null);

  readonly dateRangeKeys: DateRangeKey[] = ['all', 'last30', 'last90', 'thisYear', 'custom'];
  readonly granularityKeys: Granularity[] = ['daily', 'weekly', 'monthly'];

  constructor() {
    this.translate.onLangChange.subscribe(event => this.language.set(event.lang));
  }

  ngOnInit(): void {
    this.api.getJobStatusHistory().subscribe(entries => this.history.set(entries));
  }

  // ── Filters ──────────────────────────────────────────────
  setDateRange(key: DateRangeKey): void { this.dateRangeKey.set(key); }

  toggleStatus(key: string): void {
    this.statusFilter.update(previous => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  clearStatusFilter(): void { this.statusFilter.set(new Set<string>()); }

  setCompany(company: string): void { this.companyFilter.set(company); }

  setGranularity(value: Granularity): void { this.granularityOverride.set(value); }

  clearFilters(): void {
    this.dateRangeKey.set(DEFAULT_DATE_RANGE);
    this.customFrom.set('');
    this.customTo.set('');
    this.statusFilter.set(new Set<string>());
    this.companyFilter.set('');
  }

  readonly hasActiveDateRange = computed(() => this.dateRangeKey() !== DEFAULT_DATE_RANGE);

  readonly hasActiveFilters = computed(() =>
    this.dateRangeKey() !== DEFAULT_DATE_RANGE || this.statusFilter().size > 0 || !!this.companyFilter()
  );

  readonly companyOptions = computed(() =>
    Array.from(new Set(this.store.jobs().map(job => job.company))).sort((a, b) => a.localeCompare(b))
  );

  readonly sortedStatusConfigs = computed(() =>
    [...this.store.statusConfigs()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  );

  // ── Date range resolution ────────────────────────────────
  private readonly earliestJobDate = computed(() => {
    const times = this.store.jobs().map(job => toDate(job.date).getTime());
    return times.length ? new Date(Math.min(...times)) : null;
  });

  /** Explicit bounds for every range except "all time", which stays unbounded. */
  readonly rangeBounds = computed<{ from: Date; to: Date } | null>(() => {
    const today = startOfDay(new Date());
    const key = this.dateRangeKey();
    if (key === 'last30') return { from: addDays(today, -29), to: today };
    if (key === 'last90') return { from: addDays(today, -89), to: today };
    if (key === 'thisYear') return { from: new Date(today.getFullYear(), 0, 1), to: today };
    if (key === 'custom') {
      const from = this.customFrom() ? toDate(this.customFrom()) : null;
      const to = this.customTo() ? toDate(this.customTo()) : null;
      return from && to && from <= to ? { from, to } : null;
    }
    return null;
  });

  /** The bounds actually plotted — "all time" widens to the first tracked application. */
  readonly plottedRange = computed<{ from: Date; to: Date }>(() => {
    const bounds = this.rangeBounds();
    if (bounds) return bounds;
    const today = startOfDay(new Date());
    return { from: this.earliestJobDate() ?? today, to: today };
  });

  private readonly previousRange = computed<{ from: Date; to: Date } | null>(() => {
    const bounds = this.rangeBounds();
    if (!bounds) return null;
    const length = daysBetween(bounds.from, bounds.to) + 1;
    const to = addDays(bounds.from, -1);
    return { from: addDays(to, -(length - 1)), to };
  });

  readonly dateRangeLabel = computed(() => {
    this.language();
    const bounds = this.rangeBounds();
    if (bounds) return this.formatRange(bounds.from, bounds.to);
    // A half-filled custom range resolves to no bounds, but it must not read as "all time".
    const key = this.dateRangeKey();
    return this.translate.instant('statistics.filters.dateRange.' + (key === 'custom' ? 'custom' : 'all'));
  });

  readonly statusFilterLabel = computed(() => {
    this.language();
    const selected = this.statusFilter();
    if (selected.size === 0) return this.translate.instant('statistics.filters.allStatuses');
    if (selected.size === 1) {
      const key = Array.from(selected)[0];
      return this.sortedStatusConfigs().find(config => config.key === key)?.label ?? key;
    }
    return this.translate.instant('statistics.filters.statusesSelected', { count: selected.size });
  });

  readonly companyFilterLabel = computed(() => {
    this.language();
    return this.companyFilter() || this.translate.instant('statistics.filters.allCompanies');
  });

  readonly granularity = computed<Granularity>(() => {
    const override = this.granularityOverride();
    if (override) return override;
    const { from, to } = this.plottedRange();
    const span = daysBetween(from, to);
    if (span <= 100) return 'daily';
    if (span <= 300) return 'weekly';
    return 'monthly';
  });

  readonly granularityLabel = computed(() => {
    this.language();
    return this.translate.instant('statistics.granularity.' + this.granularity());
  });

  // ── Job sets ─────────────────────────────────────────────
  private readonly nonDateFiltered = computed(() => {
    const statuses = this.statusFilter();
    const company = this.companyFilter();
    return this.store.jobs().filter(job =>
      (statuses.size === 0 || statuses.has(job.status)) &&
      (!company || job.company === company)
    );
  });

  private jobsWithin(jobs: Job[], bounds: { from: Date; to: Date } | null): Job[] {
    if (!bounds) return jobs;
    return jobs.filter(job => {
      const date = toDate(job.date);
      return date >= bounds.from && date <= bounds.to;
    });
  }

  readonly filteredJobs = computed(() => this.jobsWithin(this.nonDateFiltered(), this.rangeBounds()));

  private readonly previousPeriodJobs = computed(() => this.jobsWithin(this.nonDateFiltered(), this.previousRange()));

  // ── Status history helpers ───────────────────────────────
  private configOf(status: string) {
    return this.store.statusConfigs().find(config => config.key === status);
  }

  private historyFor(jobId: number): JobStatusHistoryEntry[] {
    return this.history().filter(entry => entry.jobId === jobId).sort((a, b) => a.changedAt.localeCompare(b.changedAt));
  }

  private isResponse(status: string): boolean {
    const config = this.configOf(status);
    return !!config && (config.isInterview === true || (config.statsCategory ?? 'None') !== 'None');
  }

  private readonly everInterviewedIds = computed(() => {
    const ids = new Set<number>();
    for (const job of this.store.jobs()) if (this.configOf(job.status)?.isInterview) ids.add(job.id);
    for (const entry of this.history()) if (this.configOf(entry.newStatus)?.isInterview) ids.add(entry.jobId);
    return ids;
  });

  private readonly everRespondedIds = computed(() => {
    const ids = new Set<number>();
    for (const job of this.store.jobs()) if (this.isResponse(job.status)) ids.add(job.id);
    for (const entry of this.history()) if (this.isResponse(entry.newStatus)) ids.add(entry.jobId);
    return ids;
  });

  private firstResponseEntry(jobId: number): JobStatusHistoryEntry | null {
    return this.historyFor(jobId).find(entry => this.isResponse(entry.newStatus)) ?? null;
  }

  private responseDays(job: Job): number | null {
    const entry = this.firstResponseEntry(job.id);
    return entry ? daysBetween(toDate(job.date), new Date(entry.changedAt)) : null;
  }

  // ── Metric helpers over an arbitrary job subset ──────────
  private interviewRate(jobs: Job[]): number | null {
    if (!jobs.length) return null;
    return round1((jobs.filter(job => this.everInterviewedIds().has(job.id)).length / jobs.length) * 100);
  }

  private responseRate(jobs: Job[]): number | null {
    if (!jobs.length) return null;
    return round1((jobs.filter(job => this.everRespondedIds().has(job.id)).length / jobs.length) * 100);
  }

  private averageResponseDays(jobs: Job[]): number | null {
    const values = jobs.map(job => this.responseDays(job)).filter((value): value is number => value !== null);
    return values.length ? round1(sum(values) / values.length) : null;
  }

  private activeCount(jobs: Job[]): number {
    return jobs.filter(job => {
      const config = this.configOf(job.status);
      return config?.isActive || config?.isInterview;
    }).length;
  }

  // ── KPI cards ────────────────────────────────────────────
  readonly kpiCards = computed<KpiCard[]>(() => {
    this.language();
    const jobs = this.filteredJobs();
    const previous = this.previousPeriodJobs();
    const previousRange = this.previousRange();
    const hasComparison = !!previousRange && previous.length > 0;
    const comparisonNote = previousRange
      ? this.translate.instant('statistics.kpi.versusRange', { range: this.formatRange(previousRange.from, previousRange.to) })
      : '';

    const interviewRate = this.interviewRate(jobs);
    const responseRate = this.responseRate(jobs);
    const averageResponse = this.averageResponseDays(jobs);

    const percentDelta = (current: number, before: number): KpiDelta | null => {
      if (!hasComparison || before === 0) return null;
      const change = Math.round(((current - before) / before) * 100);
      if (change === 0) return null;
      return { text: Math.abs(change) + '%', icon: change > 0 ? 'caret-up' : 'caret-down', good: change > 0 };
    };

    const pointDelta = (current: number | null, before: number | null): KpiDelta | null => {
      if (!hasComparison || current === null || before === null) return null;
      const change = round1(current - before);
      if (change === 0) return null;
      const unit = this.translate.instant('statistics.kpi.unit.percentagePoints');
      return { text: `${Math.abs(change)} ${unit}`, icon: change > 0 ? 'caret-up' : 'caret-down', good: change > 0 };
    };

    const dayDelta = (current: number | null, before: number | null): KpiDelta | null => {
      if (!hasComparison || current === null || before === null) return null;
      const change = round1(current - before);
      if (change === 0) return null;
      const unit = this.translate.instant('statistics.kpi.unit.days');
      return { text: `${Math.abs(change)} ${unit}`, icon: change > 0 ? 'caret-up' : 'caret-down', good: change < 0 };
    };

    return [
      {
        key: 'total',
        icon: 'briefcase',
        accent: ACCENT_BLUE,
        label: this.translate.instant('statistics.kpi.total.label'),
        value: String(jobs.length),
        delta: percentDelta(jobs.length, previous.length),
        note: hasComparison ? comparisonNote : this.translate.instant('statistics.kpi.total.note')
      },
      {
        key: 'interviewRate',
        icon: 'users',
        accent: ACCENT_GREEN,
        label: this.translate.instant('statistics.kpi.interviewRate.label'),
        value: interviewRate !== null ? interviewRate + '%' : '—',
        delta: pointDelta(interviewRate, this.interviewRate(previous)),
        note: hasComparison ? comparisonNote : this.translate.instant('statistics.kpi.interviewRate.note')
      },
      {
        key: 'responseRate',
        icon: 'inbox',
        accent: ACCENT_AMBER,
        label: this.translate.instant('statistics.kpi.responseRate.label'),
        value: responseRate !== null ? responseRate + '%' : '—',
        delta: pointDelta(responseRate, this.responseRate(previous)),
        note: hasComparison ? comparisonNote : this.translate.instant('statistics.kpi.responseRate.note')
      },
      {
        key: 'averageResponse',
        icon: 'clock',
        accent: ACCENT_VIOLET,
        label: this.translate.instant('statistics.kpi.avgResponseTime.label'),
        value: averageResponse !== null
          ? this.translate.instant('statistics.kpi.dayValue', { days: averageResponse })
          : '—',
        delta: dayDelta(averageResponse, this.averageResponseDays(previous)),
        note: hasComparison ? comparisonNote : this.translate.instant('statistics.kpi.avgResponseTime.note')
      },
      {
        key: 'pipeline',
        icon: 'layers',
        accent: ACCENT_TEAL,
        label: this.translate.instant('statistics.kpi.pipeline.label'),
        value: String(this.activeCount(jobs)),
        delta: null,
        note: this.translate.instant('statistics.kpi.pipeline.note')
      }
    ];
  });

  // ── Applications over time ───────────────────────────────
  private readonly timeline = computed<{ categories: string[]; values: number[] }>(() => {
    this.language();
    const { from, to } = this.plottedRange();
    const jobs = this.filteredJobs();
    const granularity = this.granularity();
    const locale = this.locale();

    const buckets: { start: Date; end: Date; label: string }[] = [];

    if (granularity === 'monthly') {
      let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
      while (cursor <= to) {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        buckets.push({ start: cursor, end: next, label: monthLabel(cursor, locale) });
        cursor = next;
      }
    } else if (granularity === 'weekly') {
      let cursor = addDays(from, -((from.getDay() + 6) % 7));
      while (cursor <= to) {
        const next = addDays(cursor, 7);
        buckets.push({ start: cursor, end: next, label: cursor.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) });
        cursor = next;
      }
    } else {
      let cursor = new Date(from);
      while (cursor <= to) {
        const next = addDays(cursor, 1);
        buckets.push({ start: cursor, end: next, label: cursor.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) });
        cursor = next;
      }
    }

    const values = buckets.map(bucket =>
      jobs.filter(job => {
        const date = toDate(job.date);
        return date >= bucket.start && date < bucket.end;
      }).length
    );

    return { categories: buckets.map(bucket => bucket.label), values };
  });

  readonly timelineCategories = computed(() => this.timeline().categories);

  readonly timelineSeries = computed<ChartSeriesInput[]>(() => {
    this.language();
    return [{
      key: 'applications',
      label: this.translate.instant('statistics.charts.timeline.seriesLabel'),
      color: ACCENT_BLUE,
      values: this.timeline().values
    }];
  });

  readonly timelineNote = computed<PanelNote>(() => {
    this.language();
    const values = this.timeline().values;
    const total = sum(values);
    if (total === 0) {
      return {
        accent: ACCENT_BLUE, icon: 'info',
        title: this.translate.instant('statistics.charts.timeline.note.emptyTitle'),
        body: this.translate.instant('statistics.charts.timeline.note.emptyBody')
      };
    }
    const half = Math.ceil(values.length / 2);
    const earlier = sum(values.slice(0, half));
    const recent = sum(values.slice(half));
    const key = recent > earlier * 1.1 ? 'rising' : recent < earlier * 0.9 ? 'slowing' : 'steady';
    return {
      accent: ACCENT_BLUE, icon: 'info',
      title: this.translate.instant(`statistics.charts.timeline.note.${key}Title`),
      body: this.translate.instant(`statistics.charts.timeline.note.${key}Body`, { recent, earlier })
    };
  });

  // ── Status overview ──────────────────────────────────────
  readonly statusSlices = computed<DonutSliceInput[]>(() => {
    const jobs = this.filteredJobs();
    return this.sortedStatusConfigs()
      .map(config => ({
        key: config.key,
        label: config.label,
        color: config.color,
        value: jobs.filter(job => job.status === config.key).length
      }))
      .filter(slice => slice.value > 0);
  });

  readonly statusTotalLabel = computed(() => {
    this.language();
    return this.translate.instant('statistics.statusDistribution.total');
  });

  readonly statusNote = computed<PanelNote>(() => {
    this.language();
    const slices = this.statusSlices();
    if (!slices.length) {
      return {
        accent: ACCENT_VIOLET, icon: 'pie',
        title: this.translate.instant('statistics.statusOverview.note.emptyTitle'),
        body: this.translate.instant('statistics.statusOverview.note.emptyBody')
      };
    }
    const dominant = [...slices].sort((a, b) => b.value - a.value)[0];
    const config = this.configOf(dominant.key);
    const bodyKey = config?.statsCategory === 'Rejected' ? 'rejectedBody'
      : config?.statsCategory === 'Success' ? 'successBody'
        : config?.isInterview ? 'interviewBody'
          : 'defaultBody';
    return {
      accent: ACCENT_VIOLET, icon: 'pie',
      title: this.translate.instant('statistics.statusOverview.note.title', { status: dominant.label }),
      body: this.translate.instant('statistics.statusOverview.note.' + bodyKey)
    };
  });

  // ── Source breakdown (sample data — no source field is tracked yet) ──
  readonly sourceItems = computed<HBarItem[]>(() => {
    const counts = new Array(SOURCES.length).fill(0);
    for (const job of this.filteredJobs()) counts[hash(job.company + job.position) % SOURCES.length]++;
    return SOURCES.map((label, index) => ({ label, value: counts[index], color: SOURCE_COLORS[index] }));
  });

  readonly sourceNote = computed<PanelNote>(() => {
    this.language();
    const top = [...this.sourceItems()].sort((a, b) => b.value - a.value)[0];
    if (!top || top.value === 0) {
      return {
        accent: ACCENT_GREEN, icon: 'star',
        title: this.translate.instant('statistics.charts.source.note.emptyTitle'),
        body: this.translate.instant('statistics.charts.source.note.emptyBody')
      };
    }
    return {
      accent: ACCENT_GREEN, icon: 'star',
      title: this.translate.instant('statistics.charts.source.note.title', { source: top.label }),
      body: this.translate.instant('statistics.charts.source.note.body')
    };
  });

  // ── Response time trend ──────────────────────────────────
  private readonly responseTrend = computed<{ categories: string[]; values: number[] }>(() => {
    this.language();
    const locale = this.locale();
    const monthly = new Map<string, { total: number; count: number; date: Date }>();

    for (const job of this.filteredJobs()) {
      const days = this.responseDays(job);
      if (days === null) continue;
      const date = toDate(job.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = monthly.get(key) ?? { total: 0, count: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
      bucket.total += days;
      bucket.count++;
      monthly.set(key, bucket);
    }

    const ordered = Array.from(monthly.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6);

    return {
      categories: ordered.map(bucket => monthLabel(bucket.date, locale)),
      values: ordered.map(bucket => round1(bucket.total / bucket.count))
    };
  });

  readonly responseTrendCategories = computed(() => this.responseTrend().categories);

  readonly responseTrendSeries = computed<ChartSeriesInput[]>(() => {
    this.language();
    const values = this.responseTrend().values;
    if (values.length < 2) return [];
    return [{
      key: 'responseTime',
      label: this.translate.instant('statistics.charts.responseTrend.seriesLabel'),
      color: ACCENT_GREEN,
      values
    }];
  });

  readonly responseTrendCallout = computed<PanelNote | null>(() => {
    this.language();
    const { categories, values } = this.responseTrend();
    if (values.length < 2) return null;
    const change = round1(values[0] - values[values.length - 1]);
    if (change > 0.1) {
      return {
        accent: ACCENT_GREEN, icon: 'arrow-down',
        title: this.translate.instant('statistics.charts.responseTrend.callout.improvingTitle'),
        body: this.translate.instant('statistics.charts.responseTrend.callout.improvingBody', { days: change, month: categories[0] })
      };
    }
    if (change < -0.1) {
      return {
        accent: ACCENT_AMBER, icon: 'arrow-up',
        title: this.translate.instant('statistics.charts.responseTrend.callout.slowingTitle'),
        body: this.translate.instant('statistics.charts.responseTrend.callout.slowingBody', { days: Math.abs(change), month: categories[0] })
      };
    }
    return {
      accent: ACCENT_BLUE, icon: 'info',
      title: this.translate.instant('statistics.charts.responseTrend.callout.steadyTitle'),
      body: this.translate.instant('statistics.charts.responseTrend.callout.steadyBody', { days: values[values.length - 1] })
    };
  });

  // ── Day of week performance ──────────────────────────────
  private readonly weekdayStats = computed(() => {
    const counts = new Array(7).fill(0);
    const responded = new Array(7).fill(0);
    for (const job of this.filteredJobs()) {
      const index = (toDate(job.date).getDay() + 6) % 7;
      counts[index]++;
      if (this.everRespondedIds().has(job.id)) responded[index]++;
    }
    const rates = counts.map((count, index) => (count ? round1((responded[index] / count) * 100) : 0));

    let bestIndex = -1;
    for (let index = 0; index < 7; index++) {
      if (!counts[index]) continue;
      if (bestIndex < 0 || rates[index] > rates[bestIndex] ||
        (rates[index] === rates[bestIndex] && counts[index] > counts[bestIndex])) {
        bestIndex = index;
      }
    }
    return { counts, rates, bestIndex };
  });

  readonly weekdayItems = computed<ComboChartItem[]>(() => {
    this.language();
    const { counts, rates, bestIndex } = this.weekdayStats();
    if (!sum(counts)) return [];
    return WEEKDAY_KEYS.map((key, index) => ({
      label: this.translate.instant('statistics.weekday.short.' + key),
      barValue: counts[index],
      lineValue: rates[index],
      best: index === bestIndex
    }));
  });

  readonly weekdayCallout = computed<PanelNote | null>(() => {
    this.language();
    const { counts, rates, bestIndex } = this.weekdayStats();
    if (bestIndex < 0) return null;
    return {
      accent: ACCENT_GREEN, icon: 'calendar',
      title: this.translate.instant('statistics.weekday.full.' + WEEKDAY_KEYS[bestIndex]),
      body: this.translate.instant('statistics.charts.weekday.callout.body', { rate: rates[bestIndex], count: counts[bestIndex] })
    };
  });

  readonly bestDayBadge = computed(() => {
    this.language();
    return this.translate.instant('statistics.charts.weekday.bestBadge');
  });

  readonly weekdayBarLabel = computed(() => {
    this.language();
    return this.translate.instant('statistics.charts.weekday.applications');
  });

  readonly weekdayLineLabel = computed(() => {
    this.language();
    return this.translate.instant('statistics.charts.weekday.responseRate');
  });

  // ── What the data shows ──────────────────────────────────
  readonly dataInsights = computed<DataInsight[]>(() => {
    this.language();
    const t = (key: string, params?: Record<string, unknown>) => this.translate.instant(key, params);
    const jobs = this.filteredJobs();
    const previous = this.previousPeriodJobs();
    const insights: DataInsight[] = [];

    if (previous.length > 0) {
      const change = Math.round(((jobs.length - previous.length) / previous.length) * 100);
      const key = change > 0 ? 'momentumUp' : change < 0 ? 'momentumDown' : 'momentumFlat';
      insights.push({
        key: 'momentum',
        title: t(`statistics.summary.${key}.title`),
        body: t(`statistics.summary.${key}.body`, { percent: Math.abs(change) })
      });
    } else if (jobs.length > 0) {
      insights.push({
        key: 'volume',
        title: t('statistics.summary.volume.title'),
        body: t('statistics.summary.volume.body', { count: jobs.length })
      });
    }

    const trend = this.responseTrend().values;
    const averageResponse = this.averageResponseDays(jobs);
    if (trend.length >= 2) {
      const change = round1(trend[0] - trend[trend.length - 1]);
      const key = change > 0.1 ? 'responseImproved' : change < -0.1 ? 'responseSlowed' : 'responseSteady';
      insights.push({
        key: 'responseTime',
        title: t(`statistics.summary.${key}.title`),
        body: t(`statistics.summary.${key}.body`, { days: Math.abs(change), current: trend[trend.length - 1] })
      });
    } else if (averageResponse !== null) {
      insights.push({
        key: 'responseTime',
        title: t('statistics.summary.responseSteady.title'),
        body: t('statistics.summary.responseSteady.body', { days: averageResponse, current: averageResponse })
      });
    }

    const slices = this.statusSlices();
    if (slices.length && jobs.length) {
      const dominant = [...slices].sort((a, b) => b.value - a.value)[0];
      insights.push({
        key: 'followUp',
        title: t('statistics.summary.followUp.title'),
        body: t('statistics.summary.followUp.body', {
          percent: Math.round((dominant.value / jobs.length) * 100),
          status: dominant.label
        })
      });
    }

    const { counts, rates, bestIndex } = this.weekdayStats();
    if (bestIndex >= 0) {
      insights.push({
        key: 'bestDay',
        title: t('statistics.summary.bestDay.title'),
        body: t('statistics.summary.bestDay.body', {
          day: t('statistics.weekday.full.' + WEEKDAY_KEYS[bestIndex]),
          rate: rates[bestIndex],
          count: counts[bestIndex]
        })
      });
    }

    const companies = new Set(jobs.map(job => job.company)).size;
    if (insights.length < 4 && companies > 0) {
      insights.push({
        key: 'reach',
        title: t('statistics.summary.reach.title'),
        body: t('statistics.summary.reach.body', { count: companies })
      });
    }

    return insights.slice(0, 4);
  });

  // ── Formatting ───────────────────────────────────────────
  locale(): string {
    return this.language() === 'en' ? 'en-US' : 'hu-HU';
  }

  private formatRange(from: Date, to: Date): string {
    const locale = this.locale();
    const sameYear = from.getFullYear() === to.getFullYear();
    const fromText = from.toLocaleDateString(locale, sameYear
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' });
    const toText = to.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    return `${fromText} – ${toText}`;
  }
}
