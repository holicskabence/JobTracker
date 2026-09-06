import { WorkMode } from './user.model';

export type JobStatus = string;

export type StatusOutcome = 'Open' | 'Success' | 'Rejected' | 'Withdrawn' | 'Ghosted';

export const STATUS_OUTCOMES: StatusOutcome[] = ['Open', 'Success', 'Rejected', 'Withdrawn', 'Ghosted'];

export interface JobSource {
  id?:           number;
  name:          string;
  matchPattern?: string | null;
}

export interface JobStatusConfig {
  id?:                  number;
  key:                  string;
  label:                string;
  color:                string;
  description?:         string | null;
  sortOrder?:           number;
  showInKanban?:        boolean;
  countsAsApplication?: boolean;
  countsAsResponse?:    boolean;
  isInterview?:         boolean;
  isTerminal?:          boolean;
  outcome?:             StatusOutcome;
  staleAfterDays?:      number | null;
}

export type DashboardTab = 'overview' | 'applications' | 'events' | 'documents' | 'statistics' | 'profile' | 'master-data' | 'practice';

export interface Job {
  id: number;
  company: string;
  position: string;
  link?: string;
  source?: string;
  date: string;
  status: JobStatus;
  salary?: string | null;
  officeLocation?: string | null;
  workMode?: WorkMode | null;
  benefits?: string | null;
  description?: string | null;
  updatedAt?: string;
}

export interface JobStatusHistoryEntry {
  id: number;
  jobId: number;
  company: string;
  position: string;
  previousStatus: JobStatus | null;
  newStatus: JobStatus;
  changedAt: string;
}

export type StatsGranularity = 'day' | 'week' | 'month';
export type StatsViewMode = 'count' | 'cumulative';

export interface StatsSeriesPoint {
  period: string;
  counts: Record<string, number>;
}

export interface JobStats {
  totalJobs: number;
  submitted: number;
  activeJobs: number;
  stalledJobs: number;
  callbacks: number;
  interviewCount: number;
  offers: number;
  rejections: number;
  withdrawn: number;
  ghosted: number;
  closed: number;
  successRate: number;
  responseRate: number;
}

export const DEFAULT_STATUS_CONFIGS: JobStatusConfig[] = [
  { key: 'Saved',     label: 'Saved',     color: '#9b9b99' },
  { key: 'Applied',   label: 'Applied',   color: '#5fb9fa' },
  { key: 'Interview', label: 'Interview', color: '#f59e0b' },
  { key: 'Offer',     label: 'Offer',     color: '#26ac00' },
  { key: 'Rejected',  label: 'Rejected',  color: '#ef4444' },
];

export const KANBAN_COLUMNS: { status: JobStatus; label: string }[] =
  DEFAULT_STATUS_CONFIGS.map(c => ({ status: c.key, label: c.label }));

export const STATUS_LABELS: Record<string, string> =
  Object.fromEntries(DEFAULT_STATUS_CONFIGS.map(c => [c.key, c.label]));

export const STATUS_COLORS: Record<string, string> =
  Object.fromEntries(DEFAULT_STATUS_CONFIGS.map(c => [c.key, c.color]));

export const STATUS_CSS_KEYS: Record<string, string> = {
  Saved: 'saved', Applied: 'applied', Interview: 'interview',
  Offer: 'offer', Rejected: 'rejected'
};

/** Keeps the status flags consistent so a rate can never have a smaller denominator than its numerator. */
export function normalizeStatusConfig(config: JobStatusConfig): JobStatusConfig {
  const next = { ...config };
  if ((next.outcome ?? 'Open') !== 'Open') {
    next.isTerminal = true;
    next.countsAsApplication = true;
    if (next.outcome === 'Success' || next.outcome === 'Rejected') next.countsAsResponse = true;
  }
  if (next.isInterview) next.countsAsResponse = true;
  if (next.countsAsResponse) next.countsAsApplication = true;
  next.staleAfterDays = next.isTerminal || !next.staleAfterDays || next.staleAfterDays < 1
    ? null
    : Math.min(next.staleAfterDays, 365);
  return next;
}
