import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { JobApiService } from './job-api.service';
import {
  Job,
  JobStats,
  JobStatus,
  JobStatusConfig,
  MonthlyStatsPoint
} from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobStoreService {
  readonly jobs = signal<Job[]>([]);
  readonly monthlyStats = signal<MonthlyStatsPoint[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly statusConfigs = signal<JobStatusConfig[]>([]);

  readonly modalOpen = signal(false);
  readonly editingJob = signal<Job | null>(null);

  readonly statusColumns = computed(() =>
    this.statusConfigs().map(c => ({ status: c.key, label: c.label }))
  );

  readonly stats = computed<JobStats>(() => {
    const jobs = this.jobs();
    const offers = jobs.filter(j => j.status === 'Ajanlat').length;
    const rejects = jobs.filter(j => j.status === 'Elutasitva').length;
    const decided = offers + rejects;
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'Beadva' || j.status === 'Visszahivas').length,
      callbacks: jobs.filter(j => j.status === 'Visszahivas').length,
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

    this.api.getMonthlyStats().subscribe({
      next: stats => this.monthlyStats.set(stats),
      complete: () => this.loading.set(false)
    });
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
