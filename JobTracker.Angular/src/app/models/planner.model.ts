export interface CalendarEvent {
  id: number;
  jobId: number | null;
  type: string;
  company: string;
  date: string;
  time: string;
  notes: string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface UserDocument {
  id: number;
  name: string;
  type: string;
  updated: string;
  version: string;
  hasFile: boolean;
  fileName: string | null;
}

export const DOCUMENT_TYPES = ['Önéletrajz', 'Kísérőlevél', 'Egyéb'] as const;

export interface OutreachTemplate {
  id: number;
  key: string;
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  { id: 1, key: 'afterApplying' },
  { id: 2, key: 'afterInterview' }
];

export const outreachTemplateKey = (template: OutreachTemplate, field: 'title' | 'desc' | 'text'): string =>
  `outreachTemplates.${template.key}.${field}`;
