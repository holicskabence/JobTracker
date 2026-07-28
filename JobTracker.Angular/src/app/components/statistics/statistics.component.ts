import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { JobStoreService } from '../../services/job-store.service';
import { JobApiService } from '../../services/job-api.service';
import { AuthService } from '../../services/auth.service';
import { Job, JobStatusHistoryEntry } from '../../models/job.model';
import { AreaChartComponent, ChartSeriesInput } from './area-chart/area-chart.component';
import { DonutChartComponent } from './donut-chart/donut-chart.component';
import { ActivityHeatmapComponent } from './activity-heatmap/activity-heatmap.component';
import { BarChartComponent, BarChartBar } from './bar-chart/bar-chart.component';
import { HorizontalBarChartComponent, HBarItem } from './horizontal-bar-chart/horizontal-bar-chart.component';
import { PieChartComponent, PieChartSlice } from './pie-chart/pie-chart.component';
import { ScatterChartComponent, ScatterPoint } from './scatter-chart/scatter-chart.component';
import { FunnelChartComponent, FunnelStage } from './funnel-chart/funnel-chart.component';
import { RadarChartComponent, RadarAxis } from './radar-chart/radar-chart.component';
import { GaugeChartComponent } from './gauge-chart/gauge-chart.component';
import { CardComponent } from '../shared/card/card.component';
import { BadgeComponent } from '../shared/badge/badge.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { SelectDropdownComponent } from '../shared/select-dropdown/select-dropdown.component';

type DateRangeKey = 'last30' | 'last90' | 'thisYear' | 'all' | 'custom';

interface Kpi {
  icon: string;
  labelKey: string;
  value: string;
  subtitleKey: string;
  subtitleParams?: Record<string, unknown>;
  trend: number | null;
  trendGood: boolean;
  accent: string;
}

interface Insight {
  icon: string;
  accent: string;
  text: string;
}

interface CompanyRank {
  company: string;
  applications: number;
  interviews: number;
  offers: number;
  avgResponseDays: number | null;
  salary: number;
}

interface ActivityItem {
  id: number;
  icon: string;
  accent: string;
  text: string;
  when: string;
}

interface PipelineStage {
  key: string;
  label: string;
  color: string;
  count: number;
  percent: number;
  avgDays: number | null;
}

interface StoredGoals {
  interview: number;
  offers: number;
}

const GOALS_STORAGE_KEY = 'jobtracker.stats.goals';
const DAY_MS = 86_400_000;

const SOURCES = ['LinkedIn', 'Profession', 'NoFluffJobs', 'Referral', 'Company Website', 'Other'];
const SOURCE_COLORS = ['#5fb9fa', '#26ac00', '#ec4899', '#f59e0b', '#14b8a6', '#9b9b99'];
const COMPANY_SIZE_BANDS = ['1-50', '51-200', '201-1000', '1001-5000', '5000+'];
const CATEGORICAL = ['#5fb9fa', '#26ac00', '#ec4899', '#f59e0b', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444'];
const SKILL_KEYWORDS = ['.NET', 'Angular', 'React', 'Azure', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'TypeScript', 'C#'];
const COUNTRIES = ['Hungary', 'Germany', 'United Kingdom', 'Netherlands', 'Remote (Other)'];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Telecom', 'Other'];

function hash(str: string, salt = ''): number {
  const combined = str + salt;
  let h = 5381;
  for (let i = 0; i < combined.length; i++) h = ((h << 5) + h + combined.charCodeAt(i)) >>> 0;
  return h;
}

function toDate(dateStr: string): Date {
  return new Date(dateStr.split('T')[0] + 'T00:00:00');
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? null : 100;
  return Math.round(((curr - prev) / prev) * 100);
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    AreaChartComponent, DonutChartComponent, ActivityHeatmapComponent, BarChartComponent,
    HorizontalBarChartComponent, PieChartComponent, ScatterChartComponent, FunnelChartComponent,
    RadarChartComponent, GaugeChartComponent, CardComponent, BadgeComponent, EmptyStateComponent,
    PageSectionComponent, SelectDropdownComponent, TranslateModule
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  readonly store = inject(JobStoreService);
  private readonly api = inject(JobApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly history = signal<JobStatusHistoryEntry[]>([]);

  // ── Filters ──────────────────────────────────────────────
  readonly dateRangeKey = signal<DateRangeKey>('all');
  readonly customFrom = signal('');
  readonly customTo = signal('');
  readonly statusFilter = signal<Set<string>>(new Set());
  readonly companyFilter = signal('');

  readonly companyOptions = computed(() => {
    const all = Array.from(new Set(this.store.jobs().map(j => j.company))).sort((a, b) => a.localeCompare(b));
    return [this.translate.instant('statistics.filters.allCompanies'), ...all];
  });

  ngOnInit(): void {
    this.api.getJobStatusHistory().subscribe(entries => this.history.set(entries));
  }

  setDateRange(key: DateRangeKey): void { this.dateRangeKey.set(key); }

  toggleStatus(key: string): void {
    this.statusFilter.update(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  onCompanyChange(value: string): void {
    const allLabel = this.translate.instant('statistics.filters.allCompanies');
    this.companyFilter.set(value === allLabel ? '' : value);
  }

  clearFilters(): void {
    this.dateRangeKey.set('all');
    this.statusFilter.set(new Set());
    this.companyFilter.set('');
  }

  readonly hasActiveFilters = computed(() =>
    this.dateRangeKey() !== 'all' || this.statusFilter().size > 0 || !!this.companyFilter()
  );

  // ── Base filtered sets ───────────────────────────────────
  private readonly nonDateFiltered = computed(() => {
    const statuses = this.statusFilter();
    const company = this.companyFilter();
    return this.store.jobs().filter(j =>
      (statuses.size === 0 || statuses.has(j.status)) &&
      (!company || j.company === company)
    );
  });

  private readonly rangeBounds = computed<{ from: Date | null; to: Date }>(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const key = this.dateRangeKey();
    if (key === 'last30') return { from: new Date(now.getTime() - 30 * DAY_MS), to: now };
    if (key === 'last90') return { from: new Date(now.getTime() - 90 * DAY_MS), to: now };
    if (key === 'thisYear') return { from: new Date(now.getFullYear(), 0, 1), to: now };
    if (key === 'custom' && this.customFrom() && this.customTo()) {
      return { from: toDate(this.customFrom()), to: toDate(this.customTo()) };
    }
    return { from: null, to: now };
  });

  readonly filteredJobs = computed(() => {
    const { from, to } = this.rangeBounds();
    return this.nonDateFiltered().filter(j => {
      const d = toDate(j.date);
      return (!from || d >= from) && d <= new Date(to.getTime() + DAY_MS - 1);
    });
  });

  private configOf(status: string) {
    return this.store.statusConfigs().find(c => c.key === status);
  }

  private historyFor(jobId: number): JobStatusHistoryEntry[] {
    return this.history().filter(h => h.jobId === jobId).sort((a, b) => a.changedAt.localeCompare(b.changedAt));
  }

  /** Jobs that ever reached an interview-flagged status, using history + current status. */
  private readonly everInterviewedIds = computed(() => {
    const ids = new Set<number>();
    for (const j of this.store.jobs()) {
      if (this.configOf(j.status)?.isInterview) ids.add(j.id);
    }
    for (const h of this.history()) {
      if (this.configOf(h.newStatus)?.isInterview) ids.add(h.jobId);
    }
    return ids;
  });

  private isResponded(status: string): boolean {
    const cfg = this.configOf(status);
    return !!cfg && (cfg.isInterview || cfg.statsCategory !== 'None');
  }

  /** First history entry (or none) marking a "response" (interview / success / rejected) for a job. */
  private firstResponseEntry(jobId: number): JobStatusHistoryEntry | null {
    return this.historyFor(jobId).find(h => this.isResponded(h.newStatus)) ?? null;
  }

  private firstInterviewEntry(jobId: number): JobStatusHistoryEntry | null {
    return this.historyFor(jobId).find(h => this.configOf(h.newStatus)?.isInterview) ?? null;
  }

  // ── KPI metric helpers (operate on an arbitrary job subset) ──
  private countActive(jobs: Job[]): number { return jobs.filter(j => this.configOf(j.status)?.isActive).length; }
  private countInterview(jobs: Job[]): number { return jobs.filter(j => this.configOf(j.status)?.isInterview).length; }
  private countOffers(jobs: Job[]): number { return jobs.filter(j => this.configOf(j.status)?.statsCategory === 'Success').length; }
  private countRejections(jobs: Job[]): number { return jobs.filter(j => this.configOf(j.status)?.statsCategory === 'Rejected').length; }
  private countResponded(jobs: Job[]): number { return jobs.filter(j => this.isResponded(j.status) || this.everInterviewedIds().has(j.id)).length; }

  private avgResponseDays(jobs: Job[]): number | null {
    const deltas: number[] = [];
    for (const j of jobs) {
      const entry = this.firstResponseEntry(j.id);
      if (entry) deltas.push(daysBetween(toDate(j.date), new Date(entry.changedAt)));
    }
    if (!deltas.length) return null;
    return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
  }

  private avgInterviewDays(jobs: Job[]): number | null {
    const deltas: number[] = [];
    for (const j of jobs) {
      const entry = this.firstInterviewEntry(j.id);
      if (entry) deltas.push(daysBetween(toDate(j.date), new Date(entry.changedAt)));
    }
    if (!deltas.length) return null;
    return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
  }

  private successRateOf(jobs: Job[]): number {
    const offers = this.countOffers(jobs), rejections = this.countRejections(jobs);
    const decided = offers + rejections;
    return decided > 0 ? Math.round((offers / decided) * 100) : 0;
  }

  // ── Trend window (fixed rolling 30d vs previous 30d, filter-aware) ──
  private readonly trendWindows = computed(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const jobs = this.nonDateFiltered();
    const curr = jobs.filter(j => daysBetween(toDate(j.date), now) <= 30);
    const prev = jobs.filter(j => { const d = daysBetween(toDate(j.date), now); return d > 30 && d <= 60; });
    return { curr, prev };
  });

  // ── KPI cards ────────────────────────────────────────────
  readonly kpis = computed<Kpi[]>(() => {
    const jobs = this.filteredJobs();
    const { curr, prev } = this.trendWindows();

    const total = jobs.length;
    const active = this.countActive(jobs);
    const interviews = this.countInterview(jobs);
    const everInterviewed = jobs.filter(j => this.everInterviewedIds().has(j.id)).length;
    const offers = this.countOffers(jobs);
    const rejections = this.countRejections(jobs);
    const successRate = this.successRateOf(jobs);
    const responded = this.countResponded(jobs);
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    const avgResponse = this.avgResponseDays(jobs);
    const avgInterview = this.avgInterviewDays(jobs);

    return [
      {
        icon: 'stack', labelKey: 'statistics.kpi.total.label', value: String(total),
        subtitleKey: 'statistics.kpi.total.sub', trend: pct(curr.length, prev.length), trendGood: true, accent: '#5fb9fa'
      },
      {
        icon: 'pulse', labelKey: 'statistics.kpi.active.label', value: String(active),
        subtitleKey: 'statistics.kpi.active.sub', trend: pct(this.countActive(curr), this.countActive(prev)), trendGood: true, accent: '#14b8a6'
      },
      {
        icon: 'users', labelKey: 'statistics.kpi.interviews.label', value: String(everInterviewed),
        subtitleKey: 'statistics.kpi.interviews.sub', subtitleParams: { count: interviews },
        trend: pct(this.countInterview(curr), this.countInterview(prev)), trendGood: true, accent: '#8b5cf6'
      },
      {
        icon: 'award', labelKey: 'statistics.kpi.offers.label', value: String(offers),
        subtitleKey: 'statistics.kpi.offers.sub', trend: pct(this.countOffers(curr), this.countOffers(prev)), trendGood: true, accent: '#26ac00'
      },
      {
        icon: 'xcircle', labelKey: 'statistics.kpi.rejections.label', value: String(rejections),
        subtitleKey: 'statistics.kpi.rejections.sub', trend: pct(this.countRejections(curr), this.countRejections(prev)), trendGood: false, accent: '#ef4444'
      },
      {
        icon: 'target', labelKey: 'statistics.kpi.successRate.label', value: successRate + '%',
        subtitleKey: 'statistics.kpi.successRate.sub', trend: pct(successRate, this.successRateOf(prev)), trendGood: true, accent: '#26ac00'
      },
      {
        icon: 'inbox', labelKey: 'statistics.kpi.responseRate.label', value: responseRate + '%',
        subtitleKey: 'statistics.kpi.responseRate.sub', trend: pct(responseRate, prev.length ? Math.round((this.countResponded(prev) / prev.length) * 100) : 0), trendGood: true, accent: '#5fb9fa'
      },
      {
        icon: 'clock', labelKey: 'statistics.kpi.avgResponseTime.label', value: avgResponse !== null ? avgResponse + 'd' : '—',
        subtitleKey: 'statistics.kpi.avgResponseTime.sub', trend: pct(avgResponse ?? 0, this.avgResponseDays(prev) ?? 0), trendGood: false, accent: '#f59e0b'
      },
      {
        icon: 'calendar', labelKey: 'statistics.kpi.avgInterviewDays.label', value: avgInterview !== null ? avgInterview + 'd' : '—',
        subtitleKey: 'statistics.kpi.avgInterviewDays.sub', trend: pct(avgInterview ?? 0, this.avgInterviewDays(prev) ?? 0), trendGood: false, accent: '#f97316'
      },
      {
        icon: 'layers', labelKey: 'statistics.kpi.pipeline.label', value: String(interviews),
        subtitleKey: 'statistics.kpi.pipeline.sub', trend: null, trendGood: true, accent: '#ec4899'
      }
    ];
  });

  // ── Applications per month (line) ─────────────────────────
  readonly monthlyCategories = computed(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString(this.locale(), { month: 'short', year: '2-digit' }));
    }
    return months;
  });

  readonly monthlySeries = computed<ChartSeriesInput[]>(() => {
    const jobs = this.filteredJobs();
    const now = new Date();
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
    const appCounts = buckets.map(b => jobs.filter(j => { const d = toDate(j.date); return d.getFullYear() === b.y && d.getMonth() === b.m; }).length);
    const intCounts = buckets.map(b => jobs.filter(j => {
      const entry = this.firstInterviewEntry(j.id);
      const d = entry ? new Date(entry.changedAt) : (this.configOf(j.status)?.isInterview ? toDate(j.date) : null);
      return d && d.getFullYear() === b.y && d.getMonth() === b.m;
    }).length);
    return [
      { key: 'applications', label: this.translate.instant('statistics.charts.monthly.applications'), color: '#5fb9fa', values: appCounts },
      { key: 'interviews', label: this.translate.instant('statistics.charts.monthly.interviews'), color: '#8b5cf6', values: intCounts }
    ];
  });

  // ── Applications by week (bar) ─────────────────────────────
  readonly weeklyBars = computed<BarChartBar[]>(() => {
    const jobs = this.filteredJobs();
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const dow = (now.getDay() + 6) % 7;
    const thisMonday = new Date(now.getTime() - dow * DAY_MS);
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(thisMonday.getTime() - (11 - i) * 7 * DAY_MS);
      const end = new Date(start.getTime() + 7 * DAY_MS);
      const count = jobs.filter(j => { const d = toDate(j.date); return d >= start && d < end; }).length;
      return { label: start.toLocaleDateString(this.locale(), { month: 'short', day: 'numeric' }), value: count };
    });
  });

  // ── Weekday activity (bar) ─────────────────────────────────
  readonly weekdayBars = computed<BarChartBar[]>(() => {
    const jobs = this.filteredJobs();
    const labels = [
      this.translate.instant('statistics.weekday.short.mon'), this.translate.instant('statistics.weekday.short.tue'),
      this.translate.instant('statistics.weekday.short.wed'), this.translate.instant('statistics.weekday.short.thu'),
      this.translate.instant('statistics.weekday.short.fri'), this.translate.instant('statistics.weekday.short.sat'),
      this.translate.instant('statistics.weekday.short.sun')
    ];
    const counts = new Array(7).fill(0);
    for (const j of jobs) counts[(toDate(j.date).getDay() + 6) % 7]++;
    return labels.map((label, i) => ({ label, value: counts[i], color: i === this.bestWeekdayIndex() ? '#26ac00' : '#5fb9fa' }));
  });

  private readonly bestWeekdayIndex = computed(() => {
    const jobs = this.filteredJobs();
    const counts = new Array(7).fill(0);
    for (const j of jobs) counts[(toDate(j.date).getDay() + 6) % 7]++;
    let best = 0;
    for (let i = 1; i < 7; i++) if (counts[i] > counts[best]) best = i;
    return counts[best] > 0 ? best : -1;
  });

  // ── Response time histogram ────────────────────────────────
  readonly responseTimeBars = computed<BarChartBar[]>(() => {
    const jobs = this.filteredJobs();
    const buckets = [
      { key: 'statistics.charts.responseTime.b1', max: 2 },
      { key: 'statistics.charts.responseTime.b2', max: 5 },
      { key: 'statistics.charts.responseTime.b3', max: 10 },
      { key: 'statistics.charts.responseTime.b4', max: 20 },
      { key: 'statistics.charts.responseTime.b5', max: Infinity }
    ];
    const counts = new Array(buckets.length).fill(0);
    for (const j of jobs) {
      const entry = this.firstResponseEntry(j.id);
      if (!entry) continue;
      const d = daysBetween(toDate(j.date), new Date(entry.changedAt));
      const idx = buckets.findIndex(b => d <= b.max);
      counts[idx >= 0 ? idx : buckets.length - 1]++;
    }
    return buckets.map((b, i) => ({ label: this.translate.instant(b.key), value: counts[i], color: '#5fb9fa' }));
  });

  // ── Success funnel (real) ──────────────────────────────────
  readonly funnelStages = computed<FunnelStage[]>(() => {
    const jobs = this.filteredJobs();
    const total = jobs.length;
    const interviewed = jobs.filter(j => this.everInterviewedIds().has(j.id)).length;
    const offered = this.countOffers(jobs);
    return [
      { label: this.translate.instant('statistics.funnel.applied'), value: total, color: '#5fb9fa' },
      { label: this.translate.instant('statistics.funnel.interview'), value: interviewed, color: '#8b5cf6' },
      { label: this.translate.instant('statistics.funnel.offer'), value: offered, color: '#26ac00' }
    ];
  });

  // ── Skills radar (real: keyword matches in position titles) ──
  readonly skillsAxes = computed<RadarAxis[]>(() => {
    const jobs = this.filteredJobs();
    return SKILL_KEYWORDS.map(skill => ({
      label: skill,
      value: jobs.filter(j => j.position.toLowerCase().includes(skill.toLowerCase())).length
    }));
  });

  readonly skillsMax = computed(() => Math.max(1, ...this.skillsAxes().map(a => a.value)));
  readonly skillsHaveData = computed(() => this.skillsAxes().some(a => a.value > 0));

  // ── Interview success score (gauge, real composite) ────────
  readonly successScore = computed(() => {
    const jobs = this.filteredJobs();
    const total = jobs.length || 1;
    const interviewRate = (this.countInterview(jobs) + jobs.filter(j => this.everInterviewedIds().has(j.id)).length) / (2 * total) * 100;
    const responseRate = (this.countResponded(jobs) / total) * 100;
    const successRate = this.successRateOf(jobs);
    return Math.round(Math.max(0, Math.min(100, 0.4 * successRate + 0.3 * responseRate + 0.3 * interviewRate)));
  });

  // ── Sample data: company size, source, salary/scatter, job market ──
  readonly companySizeSlices = computed<PieChartSlice[]>(() => {
    const companies = Array.from(new Set(this.filteredJobs().map(j => j.company)));
    const counts = new Array(COMPANY_SIZE_BANDS.length).fill(0);
    for (const c of companies) counts[hash(c) % COMPANY_SIZE_BANDS.length]++;
    return COMPANY_SIZE_BANDS.map((label, i) => ({ label, value: counts[i], color: CATEGORICAL[i] }));
  });

  readonly sourceItems = computed<HBarItem[]>(() => {
    const jobs = this.filteredJobs();
    const counts = new Array(SOURCES.length).fill(0);
    for (const j of jobs) counts[hash(j.company + j.position) % SOURCES.length]++;
    return SOURCES.map((label, i) => ({ label, value: counts[i], color: SOURCE_COLORS[i] }));
  });

  private salaryFor(company: string, position: string): number {
    return 350 + (hash(company + position) % 950);
  }

  readonly salaryScatterPoints = computed<ScatterPoint[]>(() => {
    return this.filteredJobs().slice(0, 60).map(j => {
      const cfg = this.configOf(j.status);
      const color = cfg?.statsCategory === 'Success' ? '#26ac00' : cfg?.statsCategory === 'Rejected' ? '#ef4444' : '#9b9b99';
      const entry = this.firstResponseEntry(j.id);
      const y = entry ? daysBetween(toDate(j.date), new Date(entry.changedAt)) : 0;
      return { x: this.salaryFor(j.company, j.position), y, label: j.company, color };
    });
  });

  readonly workModeSlices = computed<PieChartSlice[]>(() => {
    const modes = ['Remote', 'Hybrid', 'On-site'];
    const colors = ['#26ac00', '#f59e0b', '#5fb9fa'];
    const companies = Array.from(new Set(this.filteredJobs().map(j => j.company)));
    const counts = new Array(3).fill(0);
    for (const c of companies) counts[hash(c, 'mode') % 3]++;
    return modes.map((label, i) => ({ label, value: counts[i], color: colors[i] }));
  });

  readonly countrySlices = computed<PieChartSlice[]>(() => {
    const companies = Array.from(new Set(this.filteredJobs().map(j => j.company)));
    const counts = new Array(COUNTRIES.length).fill(0);
    for (const c of companies) counts[hash(c, 'country') % COUNTRIES.length]++;
    return COUNTRIES.map((label, i) => ({ label, value: counts[i], color: CATEGORICAL[i] }));
  });

  readonly industrySlices = computed<PieChartSlice[]>(() => {
    const companies = Array.from(new Set(this.filteredJobs().map(j => j.company)));
    const counts = new Array(INDUSTRIES.length).fill(0);
    for (const c of companies) counts[hash(c, 'industry') % INDUSTRIES.length]++;
    return INDUSTRIES.map((label, i) => ({ label, value: counts[i], color: CATEGORICAL[i] }));
  });

  // ── Company analytics (real interviews/offers/response, sample salary) ──
  readonly companyRankMetric = signal<'interviews' | 'offers' | 'response' | 'salary'>('interviews');

  readonly companyRankings = computed<CompanyRank[]>(() => {
    const jobs = this.filteredJobs();
    const byCompany = new Map<string, Job[]>();
    for (const j of jobs) {
      if (!byCompany.has(j.company)) byCompany.set(j.company, []);
      byCompany.get(j.company)!.push(j);
    }
    const rows: CompanyRank[] = Array.from(byCompany.entries()).map(([company, cJobs]) => ({
      company,
      applications: cJobs.length,
      interviews: cJobs.filter(j => this.everInterviewedIds().has(j.id)).length,
      offers: this.countOffers(cJobs),
      avgResponseDays: this.avgResponseDays(cJobs),
      salary: this.salaryFor(company, cJobs[0].position)
    }));
    const metric = this.companyRankMetric();
    const sorted = [...rows].sort((a, b) => {
      if (metric === 'interviews') return b.interviews - a.interviews;
      if (metric === 'offers') return b.offers - a.offers;
      if (metric === 'salary') return b.salary - a.salary;
      const ar = a.avgResponseDays ?? Infinity, br = b.avgResponseDays ?? Infinity;
      return ar - br;
    });
    return sorted.slice(0, 5);
  });

  setCompanyRankMetric(metric: 'interviews' | 'offers' | 'response' | 'salary'): void {
    this.companyRankMetric.set(metric);
  }

  // ── Application pipeline (real) ────────────────────────────
  readonly pipelineStages = computed<PipelineStage[]>(() => {
    const jobs = this.filteredJobs();
    const total = jobs.length || 1;
    const configs = [...this.store.statusConfigs()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return configs.map(cfg => {
      const stageJobs = jobs.filter(j => j.status === cfg.key);
      const days: number[] = [];
      for (const j of stageJobs) {
        const entries = this.historyFor(j.id).filter(h => h.newStatus === cfg.key);
        const enteredAt = entries.length ? new Date(entries[entries.length - 1].changedAt) : toDate(j.date);
        days.push(daysBetween(enteredAt, new Date()));
      }
      const avgDays = days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null;
      return {
        key: cfg.key, label: cfg.label, color: cfg.color,
        count: stageJobs.length,
        percent: Math.round((stageJobs.length / total) * 100),
        avgDays
      };
    });
  });

  // ── Goals ───────────────────────────────────────────────────
  readonly applicationsGoal = computed(() => this.auth.currentUser()?.goal ?? 50);
  readonly totalApplications = computed(() => this.store.jobs().length);
  readonly applicationsGoalPct = computed(() => Math.min(100, Math.round((this.totalApplications() / this.applicationsGoal()) * 100)));

  private readonly storedGoals = signal<StoredGoals>(this.loadGoals());

  readonly interviewGoal = computed(() => this.storedGoals().interview);
  readonly offersGoal = computed(() => this.storedGoals().offers);
  readonly interviewGoalCount = computed(() => this.everInterviewedIds().size);
  readonly offersGoalCount = computed(() => this.countOffers(this.store.jobs()));
  readonly interviewGoalPct = computed(() => Math.min(100, Math.round((this.interviewGoalCount() / this.interviewGoal()) * 100)));
  readonly offersGoalPct = computed(() => Math.min(100, Math.round((this.offersGoalCount() / this.offersGoal()) * 100)));

  private loadGoals(): StoredGoals {
    try {
      const raw = localStorage.getItem(GOALS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore malformed storage */ }
    return { interview: 8, offers: 3 };
  }

  asNumber(v: unknown): number { return Number(v); }

  updateGoal(kind: 'interview' | 'offers', value: number): void {
    if (!Number.isFinite(value) || value <= 0) return;
    const next = { ...this.storedGoals(), [kind]: Math.round(value) };
    this.storedGoals.set(next);
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(next));
  }

  // ── Activity feed (real) ───────────────────────────────────
  readonly activityItems = computed<ActivityItem[]>(() => {
    const entries = [...this.history()].sort((a, b) => b.changedAt.localeCompare(a.changedAt)).slice(0, 10);
    return entries.map(e => {
      const cfg = this.configOf(e.newStatus);
      let icon = 'edit', accent = '#5fb9fa', text: string;
      if (e.previousStatus === null) {
        icon = 'plus'; accent = '#5fb9fa';
        text = this.translate.instant('statistics.activity.applied', { company: e.company });
      } else if (cfg?.statsCategory === 'Success') {
        icon = 'award'; accent = '#26ac00';
        text = this.translate.instant('statistics.activity.offer', { company: e.company });
      } else if (cfg?.statsCategory === 'Rejected') {
        icon = 'xcircle'; accent = '#ef4444';
        text = this.translate.instant('statistics.activity.rejected', { company: e.company });
      } else if (cfg?.isInterview) {
        icon = 'users'; accent = '#8b5cf6';
        text = this.translate.instant('statistics.activity.interview', { company: e.company });
      } else {
        text = this.translate.instant('statistics.activity.statusChange', { company: e.company, status: cfg?.label ?? e.newStatus });
      }
      return { id: e.id, icon, accent, text, when: this.fmtRelative(e.changedAt) };
    });
  });

  // ── Interview timeline (real) ───────────────────────────────
  readonly interviewTimeline = computed(() => {
    return [...this.history()]
      .filter(h => this.configOf(h.newStatus)?.isInterview)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
      .slice(0, 8)
      .map(h => ({ company: h.company, position: h.position, label: this.configOf(h.newStatus)?.label ?? h.newStatus, color: this.configOf(h.newStatus)?.color ?? '#8b5cf6', when: this.fmtDate(h.changedAt) }));
  });

  // ── Insights (real) ─────────────────────────────────────────
  readonly insights = computed<Insight[]>(() => {
    const jobs = this.filteredJobs();
    const result: Insight[] = [];
    const t = (key: string, params?: Record<string, unknown>) => this.translate.instant(key, params);

    if (jobs.length >= 4) {
      const half = Math.floor(jobs.length / 2);
      const sorted = [...jobs].sort((a, b) => a.date.localeCompare(b.date));
      const olderRate = this.successRateOf(sorted.slice(0, half));
      const newerRate = this.successRateOf(sorted.slice(half));
      if (newerRate !== olderRate) {
        const diff = newerRate - olderRate;
        result.push({
          icon: diff > 0 ? 'trending-up' : 'trending-down', accent: diff > 0 ? '#26ac00' : '#ef4444',
          text: t(diff > 0 ? 'statistics.insights.rateUp' : 'statistics.insights.rateDown', { pct: Math.abs(diff) })
        });
      }
    }

    const bestDay = this.bestWeekdayIndex();
    if (bestDay >= 0) {
      const dayNames = [t('statistics.weekday.full.mon'), t('statistics.weekday.full.tue'), t('statistics.weekday.full.wed'), t('statistics.weekday.full.thu'), t('statistics.weekday.full.fri'), t('statistics.weekday.full.sat'), t('statistics.weekday.full.sun')];
      result.push({ icon: 'calendar', accent: '#8b5cf6', text: t('statistics.insights.bestDay', { day: dayNames[bestDay] }) });
    }

    const avgResponse = this.avgResponseDays(jobs);
    if (avgResponse !== null) {
      result.push({ icon: 'clock', accent: '#f59e0b', text: t('statistics.insights.avgResponse', { days: avgResponse }) });
    }

    const successRate = this.successRateOf(jobs);
    if (jobs.length >= 3) {
      result.push({
        icon: successRate >= 30 ? 'thumbs-up' : 'info', accent: successRate >= 30 ? '#26ac00' : '#5fb9fa',
        text: t(successRate >= 30 ? 'statistics.insights.rateAboveAvg' : 'statistics.insights.rateBuilding', { rate: successRate })
      });
    }

    const uniqueCompanies = new Set(jobs.map(j => j.company)).size;
    if (uniqueCompanies > 0) {
      result.push({ icon: 'building', accent: '#14b8a6', text: t('statistics.insights.companiesReached', { count: uniqueCompanies }) });
    }

    const responseRate = jobs.length > 0 ? Math.round((this.countResponded(jobs) / jobs.length) * 100) : 0;
    result.push({ icon: 'inbox', accent: '#5fb9fa', text: t('statistics.insights.responseRate', { rate: responseRate }) });

    return result.slice(0, 6);
  });

  // ── Formatting helpers ──────────────────────────────────────
  locale(): string { return this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU'; }

  fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(this.locale(), { month: 'short', day: 'numeric', year: 'numeric' });
  }

  fmtRelative(iso: string): string {
    const d = new Date(iso);
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
    if (diffMin < 60) return this.translate.instant('statistics.activity.minutesAgo', { count: Math.max(1, diffMin) });
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return this.translate.instant('statistics.activity.hoursAgo', { count: diffH });
    const diffD = Math.round(diffH / 24);
    if (diffD < 30) return this.translate.instant('statistics.activity.daysAgo', { count: diffD });
    return this.fmtDate(iso);
  }

  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number): string { return this.store.colorAlpha(status, a); }
}
