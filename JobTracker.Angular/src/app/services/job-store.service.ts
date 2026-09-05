import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { JobApiService } from './job-api.service';
import {
  Job,
  JobStats,
  JobSource,
  JobStatus,
  JobStatusConfig,
  JobStatusHistoryEntry,
  StatusOutcome,
  StatsGranularity,
  StatsSeriesPoint,
  normalizeStatusConfig
} from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobStoreService {
  readonly jobs = signal<Job[]>([]);
  readonly statsSeries = signal<StatsSeriesPoint[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string>('');
  readonly statusConfigs = signal<JobStatusConfig[]>([]);
  readonly statusHistory = signal<JobStatusHistoryEntry[]>([]);
  readonly sources = signal<JobSource[]>([]);

  readonly modalOpen = signal(false);
  readonly editingJob = signal<Job | null>(null);
  readonly historyJob = signal<Job | null>(null);

  readonly statusColumns = computed(() =>
    this.statusConfigs()
      .filter(c => c.showInKanban !== false)
      .map(c => ({ status: c.key, label: c.label }))
  );

  readonly stats = computed<JobStats>(() => {
    const jobs = this.jobs();
    const configOf = (status: string) => this.statusConfigs().find(c => c.key === status);

    /** A job qualifies once it has ever touched a matching status, not only while it sits in one. */
    const everReached = (matches: (config: JobStatusConfig) => boolean) => {
      const ids = new Set<number>();
      for (const job of jobs) {
        const config = configOf(job.status);
        if (config && matches(config)) ids.add(job.id);
      }
      for (const entry of this.statusHistory()) {
        const config = configOf(entry.newStatus);
        if (config && matches(config)) ids.add(entry.jobId);
      }
      return ids;
    };

    const everInterviewed = everReached(config => config.isInterview === true);
    const everResponded = everReached(config => config.countsAsResponse === true);
    const everApplied = everReached(config => config.countsAsApplication === true);

    const withOutcome = (outcome: StatusOutcome) =>
      jobs.filter(job => (configOf(job.status)?.outcome ?? 'Open') === outcome).length;

    const offers = withOutcome('Success');
    const rejections = withOutcome('Rejected');
    const decided = offers + rejections;
    const submitted = jobs.filter(job => everApplied.has(job.id)).length;
    const responded = jobs.filter(job => everResponded.has(job.id)).length;

    return {
      totalJobs: jobs.length,
      submitted,
      activeJobs: jobs.filter(job => {
        const config = configOf(job.status);
        return !!config?.countsAsApplication && !config.isTerminal;
      }).length,
      stalledJobs: this.stalledJobs().length,
      callbacks: jobs.filter(job => everInterviewed.has(job.id)).length,
      interviewCount: jobs.filter(job => configOf(job.status)?.isInterview).length,
      offers,
      rejections,
      withdrawn: withOutcome('Withdrawn'),
      ghosted: withOutcome('Ghosted'),
      closed: jobs.filter(job => configOf(job.status)?.isTerminal).length,
      successRate: decided > 0 ? Math.round((offers / decided) * 100) : 0,
      responseRate: submitted > 0 ? Math.round((responded / submitted) * 100) : 0
    };
  });

  /** The moment the job entered the status it is in now, so "how long has this been sitting" is measurable. */
  statusEnteredAt(job: Job): Date {
    const entries = this.statusHistory().filter(entry => entry.jobId === job.id && entry.newStatus === job.status);
    if (!entries.length) return new Date(job.date);
    return new Date(entries.reduce((latest, entry) => entry.changedAt > latest.changedAt ? entry : latest).changedAt);
  }

  daysInStatus(job: Job): number {
    return Math.floor((Date.now() - this.statusEnteredAt(job).getTime()) / 86_400_000);
  }

  isStalled(job: Job): boolean {
    const limit = this.statusConfigs().find(config => config.key === job.status)?.staleAfterDays;
    return !!limit && this.daysInStatus(job) >= limit;
  }

  readonly stalledJobs = computed(() =>
    this.jobs()
      .filter(job => this.isStalled(job))
      .sort((a, b) => this.daysInStatus(b) - this.daysInStatus(a))
  );

  constructor(private readonly api: JobApiService) { }

  /** Free-text filter shared by every applications view, so kanban, table and the search count stay in sync. */
  filterJobs(term: string): Job[] {
    const needle = term.trim().toLowerCase();
    const jobs = this.jobs();
    if (!needle) return jobs;
    return jobs.filter(j =>
      j.company.toLowerCase().includes(needle) ||
      j.position.toLowerCase().includes(needle) ||
      (j.source ?? '').toLowerCase().includes(needle) ||
      this.labelFor(j.status).toLowerCase().includes(needle)
    );
  }

  filterStatusHistory(term: string): JobStatusHistoryEntry[] {
    const needle = term.trim().toLowerCase();
    const entries = this.statusHistory();
    if (!needle) return entries;
    return entries.filter(e =>
      e.company.toLowerCase().includes(needle) ||
      e.position.toLowerCase().includes(needle) ||
      this.labelFor(e.newStatus).toLowerCase().includes(needle) ||
      (!!e.previousStatus && this.labelFor(e.previousStatus).toLowerCase().includes(needle))
    );
  }

  labelFor(key: string): string {
    return this.statusConfigs().find(c => c.key === key)?.label ?? key;
  }

  colorFor(key: string): string {
    return this.statusConfigs().find(c => c.key === key)?.color ?? '#9b9b99';
  }

  colorAlpha(key: string, alpha: number): string {
    const hex = this.colorFor(key).replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  addSource(name: string, matchPattern: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (this.sources().some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    this.error.set('');
    this.api.createJobSource({ name: trimmed, matchPattern: matchPattern.trim() || null }).subscribe({
      next: created => this.sources.update(prev => [...prev, created]),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült létrehozni a forrást.')
    });
  }

  updateSource(id: number, name: string, matchPattern: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.error.set('');
    this.api.updateJobSource(id, { name: trimmed, matchPattern: matchPattern.trim() || null }).subscribe({
      next: updated => this.sources.update(prev => prev.map(s => s.id === id ? updated : s)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a forrást.')
    });
  }

  deleteSource(id: number): void {
    this.error.set('');
    this.api.deleteJobSource(id).subscribe({
      next: () => this.sources.update(prev => prev.filter(s => s.id !== id)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült törölni a forrást.')
    });
  }

  /** Guesses the source from a job link by matching the master data patterns against the URL. */
  detectSource(link: string): string {
    const url = link.trim().toLowerCase();
    if (!url) return '';
    const match = this.sources().find(s => {
      const pattern = s.matchPattern?.trim().toLowerCase();
      return !!pattern && url.includes(pattern);
    });
    return match?.name ?? '';
  }

  addStatus(label: string, color: string): void {
    const key = label.trim();
    if (!key) return;
    if (this.statusConfigs().some(c => c.key === key)) return;
    this.error.set('');
    this.api.createStatusConfig({ key, label: key, color }).subscribe({
      next: created => this.statusConfigs.update(prev => [...prev, created]),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült létrehozni a státuszt.')
    });
  }

  saveStatus(key: string, patch: Partial<JobStatusConfig>): void {
    const current = this.statusConfigs().find(config => config.key === key);
    if (!current?.id) return;
    const merged = normalizeStatusConfig({ ...current, ...patch });
    const label = merged.label.trim();
    if (!label) return;
    this.error.set('');
    this.api.updateStatusConfig(current.id, {
      label,
      color: merged.color,
      description: merged.description?.trim() || null,
      sortOrder: merged.sortOrder ?? 0,
      showInKanban: merged.showInKanban ?? true,
      countsAsApplication: merged.countsAsApplication ?? false,
      countsAsResponse: merged.countsAsResponse ?? false,
      isInterview: merged.isInterview ?? false,
      isTerminal: merged.isTerminal ?? false,
      outcome: merged.outcome ?? 'Open',
      staleAfterDays: merged.staleAfterDays ?? null
    }).subscribe({
      next: updated => this.statusConfigs.update(prev => prev.map(config => config.key === key ? updated : config)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a státuszt.')
    });
  }

  updateStatus(key: string, label: string, color: string): void {
    this.saveStatus(key, { label, color });
  }

  toggleStatusKanban(key: string): void {
    const config = this.statusConfigs().find(item => item.key === key);
    if (!config) return;
    this.saveStatus(key, { showInKanban: !(config.showInKanban ?? true) });
  }

  moveStatusUp(key: string): void {
    const configs = [...this.statusConfigs()];
    const idx = configs.findIndex(c => c.key === key);
    if (idx <= 0) return;
    [configs[idx - 1], configs[idx]] = [configs[idx], configs[idx - 1]];
    const reordered = configs.map((c, i) => ({ ...c, sortOrder: i }));
    this.statusConfigs.set(reordered);
    this.api.reorderStatusConfigs(reordered.map(c => ({ id: c.id!, sortOrder: c.sortOrder! }))).subscribe({
      next: updated => this.statusConfigs.set(updated),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült menteni a sorrendet.')
    });
  }

  moveStatusDown(key: string): void {
    const configs = [...this.statusConfigs()];
    const idx = configs.findIndex(c => c.key === key);
    if (idx < 0 || idx >= configs.length - 1) return;
    [configs[idx], configs[idx + 1]] = [configs[idx + 1], configs[idx]];
    const reordered = configs.map((c, i) => ({ ...c, sortOrder: i }));
    this.statusConfigs.set(reordered);
    this.api.reorderStatusConfigs(reordered.map(c => ({ id: c.id!, sortOrder: c.sortOrder! }))).subscribe({
      next: updated => this.statusConfigs.set(updated),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült menteni a sorrendet.')
    });
  }

  moveStatusToIndex(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    const configs = [...this.statusConfigs()];
    const [moved] = configs.splice(fromIndex, 1);
    configs.splice(toIndex, 0, moved);
    const reordered = configs.map((c, i) => ({ ...c, sortOrder: i }));
    this.statusConfigs.set(reordered);
    this.api.reorderStatusConfigs(reordered.map(c => ({ id: c.id!, sortOrder: c.sortOrder! }))).subscribe({
      next: updated => this.statusConfigs.set(updated),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült menteni a sorrendet.')
    });
  }

  deleteStatus(key: string): void {
    const cfg = this.statusConfigs().find(c => c.key === key);
    if (!cfg?.id) return;
    if (this.statusConfigs().length <= 1) return;
    this.error.set('');
    this.api.deleteStatusConfig(cfg.id).subscribe({
      next: () => this.statusConfigs.update(prev => prev.filter(c => c.key !== key)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült törölni a státuszt.')
    });
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set('');

    const statusConfigs$ = this.api.getStatusConfigs().pipe(
      tap(configs => this.statusConfigs.set(configs)),
      catchError(() => {
        this.error.set('Nem sikerült betölteni a státuszokat.');
        return of(null);
      })
    );

    const jobs$ = this.api.getJobs().pipe(
      tap(jobs => this.jobs.set(jobs)),
      catchError(() => {
        this.error.set('Nem sikerült betölteni az állásokat.');
        return of(null);
      })
    );

    const statusHistory$ = this.api.getJobStatusHistory().pipe(
      tap(entries => this.statusHistory.set(entries)),
      catchError(() => {
        this.error.set('Nem sikerült betölteni a jelentkezés változásokat.');
        return of(null);
      })
    );

    const sources$ = this.api.getJobSources().pipe(
      tap(sources => this.sources.set(sources)),
      catchError(() => of(null))
    );

    const statsSeries$ = this.api.getStatsSeries('day').pipe(
      tap(series => this.statsSeries.set(series)),
      catchError(() => of(null))
    );

    forkJoin([statusConfigs$, jobs$, statusHistory$, statsSeries$, sources$]).subscribe(() => this.loading.set(false));
  }

  loadStatsSeries(granularity: StatsGranularity): void {
    this.api.getStatsSeries(granularity).subscribe(series => this.statsSeries.set(series));
  }

  addJob(data: Omit<Job, 'id' | 'date'>): void {
    this.api.createJob(data).subscribe(created =>
      this.jobs.update(current => [created, ...current])
    );
  }

  updateJob(id: number, data: Omit<Job, 'id'>): void {
    this.api.updateJob(id, data).subscribe(updated =>
      this.jobs.update(current => [updated, ...current.filter(j => j.id !== id)])
    );
  }

  deleteJob(id: number): void {
    this.api.deleteJob(id).subscribe(() =>
      this.jobs.update(current => current.filter(j => j.id !== id))
    );
  }

  changeStatus(jobId: number, status: JobStatus): void {
    const previous = this.jobs().find(j => j.id === jobId);
    this.api.updateJobStatus(jobId, status).subscribe(() => {
      this.jobs.update(current => {
        const job = current.find(j => j.id === jobId);
        if (!job) return current;
        return [{ ...job, status }, ...current.filter(j => j.id !== jobId)];
      });
      if (previous && previous.status !== status) {
        this.statusHistory.update(current => [...current, {
          id: -Date.now(),
          jobId,
          company: previous.company,
          position: previous.position,
          previousStatus: previous.status,
          newStatus: status,
          changedAt: new Date().toISOString()
        }]);
      }
    });
  }

  openModal(job: Job | null = null): void {
    this.editingJob.set(job);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingJob.set(null);
  }

  openHistory(job: Job): void {
    this.historyJob.set(job);
  }

  closeHistory(): void {
    this.historyJob.set(null);
  }

  historyFor(jobId: number): JobStatusHistoryEntry[] {
    return this.statusHistory()
      .filter(h => h.jobId === jobId)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }
}
