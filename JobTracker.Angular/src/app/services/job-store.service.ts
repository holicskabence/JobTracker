import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { JobApiService } from './job-api.service';
import {
  Job,
  JobStats,
  JobStatus,
  JobStatusConfig,
  StatsCategory,
  StatsGranularity,
  StatsSeriesPoint
} from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobStoreService {
  readonly jobs = signal<Job[]>([]);
  readonly statsSeries = signal<StatsSeriesPoint[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly statusConfigs = signal<JobStatusConfig[]>([]);

  readonly modalOpen = signal(false);
  readonly editingJob = signal<Job | null>(null);

  readonly statusColumns = computed(() =>
    this.statusConfigs()
      .filter(c => c.showInKanban !== false)
      .map(c => ({ status: c.key, label: c.label }))
  );

  readonly stats = computed<JobStats>(() => {
    const jobs = this.jobs();
    const configOf = (status: string) => this.statusConfigs().find(c => c.key === status);

    const offers = jobs.filter(j => configOf(j.status)?.statsCategory === 'Success').length;
    const rejects = jobs.filter(j => configOf(j.status)?.statsCategory === 'Rejected').length;
    const decided = offers + rejects;
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => configOf(j.status)?.isActive).length,
      callbacks: jobs.filter(j => j.status === 'Visszahivas').length,
      interviewCount: jobs.filter(j => configOf(j.status)?.isInterview).length,
      offers,
      rejections: rejects,
      successRate: decided > 0 ? Math.round((offers / decided) * 100) : 0
    };
  });

  constructor(private readonly api: JobApiService) { }

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

  updateStatus(key: string, label: string, color: string): void {
    const cfg = this.statusConfigs().find(c => c.key === key);
    if (!cfg?.id) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    this.error.set('');
    this.api.updateStatusConfig(cfg.id, {
      label: trimmedLabel,
      color,
      sortOrder: cfg.sortOrder ?? 0,
      showInKanban: cfg.showInKanban ?? true,
      isActive: cfg.isActive ?? false,
      isInterview: cfg.isInterview ?? false,
      statsCategory: cfg.statsCategory ?? 'None'
    }).subscribe({
      next: updated => this.statusConfigs.update(prev => prev.map(c => c.key === key ? updated : c)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a státuszt.')
    });
  }

  toggleStatusKanban(key: string): void {
    const cfg = this.statusConfigs().find(c => c.key === key);
    if (!cfg?.id) return;
    this.error.set('');
    this.api.updateStatusConfig(cfg.id, {
      label: cfg.label,
      color: cfg.color,
      sortOrder: cfg.sortOrder ?? 0,
      showInKanban: !(cfg.showInKanban ?? true),
      isActive: cfg.isActive ?? false,
      isInterview: cfg.isInterview ?? false,
      statsCategory: cfg.statsCategory ?? 'None'
    }).subscribe({
      next: updated => this.statusConfigs.update(prev => prev.map(c => c.key === key ? updated : c)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a státuszt.')
    });
  }

  setStatusCategory(key: string, statsCategory: StatsCategory): void {
    const cfg = this.statusConfigs().find(c => c.key === key);
    if (!cfg?.id) return;
    this.error.set('');
    this.api.updateStatusConfig(cfg.id, {
      label: cfg.label,
      color: cfg.color,
      sortOrder: cfg.sortOrder ?? 0,
      showInKanban: cfg.showInKanban ?? true,
      isActive: cfg.isActive ?? false,
      isInterview: cfg.isInterview ?? false,
      statsCategory
    }).subscribe({
      next: updated => this.statusConfigs.update(prev => prev.map(c => c.key === key ? updated : c)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a státuszt.')
    });
  }

  toggleStatusActive(key: string): void {
    const cfg = this.statusConfigs().find(c => c.key === key);
    if (!cfg?.id) return;
    this.error.set('');
    this.api.updateStatusConfig(cfg.id, {
      label: cfg.label,
      color: cfg.color,
      sortOrder: cfg.sortOrder ?? 0,
      showInKanban: cfg.showInKanban ?? true,
      isActive: !(cfg.isActive ?? false),
      isInterview: cfg.isInterview ?? false,
      statsCategory: cfg.statsCategory ?? 'None'
    }).subscribe({
      next: updated => this.statusConfigs.update(prev => prev.map(c => c.key === key ? updated : c)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a státuszt.')
    });
  }

  toggleStatusInterview(key: string): void {
    const cfg = this.statusConfigs().find(c => c.key === key);
    if (!cfg?.id) return;
    this.error.set('');
    this.api.updateStatusConfig(cfg.id, {
      label: cfg.label,
      color: cfg.color,
      sortOrder: cfg.sortOrder ?? 0,
      showInKanban: cfg.showInKanban ?? true,
      isActive: cfg.isActive ?? false,
      isInterview: !(cfg.isInterview ?? false),
      statsCategory: cfg.statsCategory ?? 'None'
    }).subscribe({
      next: updated => this.statusConfigs.update(prev => prev.map(c => c.key === key ? updated : c)),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Nem sikerült frissíteni a státuszt.')
    });
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

    this.api.getStatusConfigs().subscribe({
      next: configs => this.statusConfigs.set(configs),
      error: () => this.error.set('Nem sikerült betölteni a státuszokat.')
    });

    this.api.getJobs().subscribe({
      next: jobs => this.jobs.set(jobs),
      error: () => this.error.set('Nem sikerült betölteni az állásokat.')
    });

    this.api.getStatsSeries('day').subscribe({
      next: series => this.statsSeries.set(series),
      complete: () => this.loading.set(false)
    });
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
      this.jobs.update(current => current.map(j => j.id === id ? updated : j))
    );
  }

  deleteJob(id: number): void {
    this.api.deleteJob(id).subscribe(() =>
      this.jobs.update(current => current.filter(j => j.id !== id))
    );
  }

  changeStatus(jobId: number, status: JobStatus): void {
    this.api.updateJobStatus(jobId, status).subscribe(() =>
      this.jobs.update(current =>
        current.map(j => j.id === jobId ? { ...j, status } : j)
      )
    );
  }

  openModal(job: Job | null = null): void {
    this.editingJob.set(job);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingJob.set(null);
  }
}
