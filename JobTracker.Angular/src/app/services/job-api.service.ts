import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job, JobStatus, JobStatusConfig, StatsGranularity, StatsSeriesPoint } from '../models/job.model';

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

  // ── Stats series ─────────────────────────────────────────
  getStatsSeries(granularity: StatsGranularity): Observable<StatsSeriesPoint[]> {
    return this.http.get<StatsSeriesPoint[]>('/api/stats/series', { params: { granularity } });
  }

  // ── Status configs ───────────────────────────────────────
  getStatusConfigs(): Observable<JobStatusConfig[]> {
    return this.http.get<JobStatusConfig[]>('/api/status-configs');
  }

  createStatusConfig(data: { key: string; label: string; color: string }): Observable<JobStatusConfig> {
    return this.http.post<JobStatusConfig>('/api/status-configs', data);
  }

  updateStatusConfig(id: number, data: { label: string; color: string; sortOrder: number }): Observable<JobStatusConfig> {
    return this.http.put<JobStatusConfig>(`/api/status-configs/${id}`, data);
  }

  deleteStatusConfig(id: number): Observable<void> {
    return this.http.delete<void>(`/api/status-configs/${id}`);
  }
}
