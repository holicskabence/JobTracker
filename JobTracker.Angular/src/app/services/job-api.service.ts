import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job, JobSource, JobStatus, JobStatusConfig, JobStatusHistoryEntry, StatsGranularity, StatsSeriesPoint, StatusOutcome } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobApiService {
  constructor(private readonly http: HttpClient) { }

  // ── Jobs ─────────────────────────────────────────────────
  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>('/api/jobs');
  }

  createJob(job: Omit<Job, 'id' | 'date'>): Observable<Job> {
    const payload = { ...job, date: new Date().toISOString().split('T')[0] };
    return this.http.post<Job>('/api/jobs', payload);
  }

  updateJob(id: number, data: Omit<Job, 'id'>): Observable<Job> {
    return this.http.put<Job>(`/api/jobs/${id}`, data);
  }

  updateJobStatus(jobId: number, status: JobStatus): Observable<Job> {
    return this.http.patch<Job>(`/api/jobs/${jobId}`, { status });
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`/api/jobs/${id}`);
  }

  // ── Status history ───────────────────────────────────────
  getJobStatusHistory(): Observable<JobStatusHistoryEntry[]> {
    return this.http.get<JobStatusHistoryEntry[]>('/api/job-status-history');
  }

  // ── Stats series ─────────────────────────────────────────
  getStatsSeries(granularity: StatsGranularity): Observable<StatsSeriesPoint[]> {
    return this.http.get<StatsSeriesPoint[]>('/api/stats/series', { params: { granularity } });
  }

  // ── Sources ─────────────────────────────────────────────
  getJobSources(): Observable<JobSource[]> {
    return this.http.get<JobSource[]>('/api/job-sources');
  }

  createJobSource(data: { name: string; matchPattern: string | null }): Observable<JobSource> {
    return this.http.post<JobSource>('/api/job-sources', data);
  }

  updateJobSource(id: number, data: { name: string; matchPattern: string | null }): Observable<JobSource> {
    return this.http.put<JobSource>(`/api/job-sources/${id}`, data);
  }

  deleteJobSource(id: number): Observable<void> {
    return this.http.delete<void>(`/api/job-sources/${id}`);
  }

  // ── Status configs ───────────────────────────────────────
  getStatusConfigs(): Observable<JobStatusConfig[]> {
    return this.http.get<JobStatusConfig[]>('/api/status-configs');
  }

  createStatusConfig(data: { key: string; label: string; color: string }): Observable<JobStatusConfig> {
    return this.http.post<JobStatusConfig>('/api/status-configs', data);
  }

  updateStatusConfig(id: number, data: {
    label: string;
    color: string;
    description: string | null;
    sortOrder: number;
    showInKanban: boolean;
    countsAsApplication: boolean;
    countsAsResponse: boolean;
    isInterview: boolean;
    isTerminal: boolean;
    outcome: StatusOutcome;
    staleAfterDays: number | null;
  }): Observable<JobStatusConfig> {
    return this.http.put<JobStatusConfig>(`/api/status-configs/${id}`, data);
  }

  deleteStatusConfig(id: number): Observable<void> {
    return this.http.delete<void>(`/api/status-configs/${id}`);
  }

  reorderStatusConfigs(items: { id: number; sortOrder: number }[]): Observable<JobStatusConfig[]> {
    return this.http.post<JobStatusConfig[]>('/api/status-configs/reorder', items);
  }
}
