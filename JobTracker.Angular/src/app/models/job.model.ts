export type JobStatus = string;

export interface JobStatusConfig {
  id?:   number;
  key:   string;
  label: string;
  color: string;
  sortOrder?: number;
}

export type DashboardTab = 'attekintes' | 'jelentkezesek' | 'tablazat' | 'esemenyek' | 'dokumentumok' | 'statisztika' | 'profil' | 'torzsadatok' | 'gyakorlas';

export interface Job {
  id: number;
  company: string;
  position: string;
  link?: string;
  date: string;
  status: JobStatus;
}

export type StatsGranularity = 'day' | 'week' | 'month';

export interface StatsSeriesPoint {
  period: string;
  counts: Record<string, number>;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  callbacks: number;
  offers: number;
  rejections: number;
  successRate: number;
}

export const DEFAULT_STATUS_CONFIGS: JobStatusConfig[] = [
  { key: 'Mentett',     label: 'Mentett',     color: '#9b9b99' },
  { key: 'Beadva',      label: 'Beadva',      color: '#5fb9fa' },
  { key: 'Visszahivas', label: 'Visszahívás', color: '#f59e0b' },
  { key: 'Ajanlat',     label: 'Ajánlat',     color: '#26ac00' },
  { key: 'Elutasitva',  label: 'Elutasítva',  color: '#ef4444' },
];

export const KANBAN_COLUMNS: { status: JobStatus; label: string }[] =
  DEFAULT_STATUS_CONFIGS.map(c => ({ status: c.key, label: c.label }));

export const STATUS_LABELS: Record<string, string> =
  Object.fromEntries(DEFAULT_STATUS_CONFIGS.map(c => [c.key, c.label]));

export const STATUS_COLORS: Record<string, string> =
  Object.fromEntries(DEFAULT_STATUS_CONFIGS.map(c => [c.key, c.color]));

export const STATUS_CSS_KEYS: Record<string, string> = {
  Mentett: 'mentett', Beadva: 'beadva', Visszahivas: 'visszahivas',
  Ajanlat: 'ajanlat', Elutasitva: 'elutasitva'
};
