/* Throwaway visual harness: renders StatisticsComponent against sample data. Not part of the app. */
import { APP_INITIALIZER, Component, importProvidersFrom, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable, firstValueFrom, of } from 'rxjs';
import { StatisticsComponent } from './app/components/statistics/statistics.component';
import { JobStoreService } from './app/services/job-store.service';
import { JobApiService } from './app/services/job-api.service';
import { Job, JobStatusConfig, JobStatusHistoryEntry } from './app/models/job.model';

const DAY = 86_400_000;
const COMPANIES = ['Aurora Labs', 'Bitwise', 'Cortex', 'Delta Systems', 'Evermore', 'Foxtrot', 'Greenline', 'Helix'];
const POSITIONS = ['.NET Developer', 'Angular Developer', 'Full Stack Engineer', 'Backend Engineer'];

const STATUS_CONFIGS: JobStatusConfig[] = [
  { key: 'Applied', label: 'Applied', color: '#8b5cf6', sortOrder: 1, isActive: true, statsCategory: 'None' },
  { key: 'Screening', label: 'Screening', color: '#5fb9fa', sortOrder: 2, isActive: true, statsCategory: 'None' },
  { key: 'Interview', label: 'Interview', color: '#14b8a6', sortOrder: 3, isActive: true, isInterview: true, statsCategory: 'None' },
  { key: 'Offer', label: 'Offer', color: '#26ac00', sortOrder: 4, statsCategory: 'Success' },
  { key: 'Rejected', label: 'Rejected', color: '#ef4444', sortOrder: 5, statsCategory: 'Rejected' }
];

function buildSampleData(): { jobs: Job[]; history: JobStatusHistoryEntry[] } {
  const jobs: Job[] = [];
  const history: JobStatusHistoryEntry[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let seed = 0x9e3779b9;
  const next = (max: number) => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) % max;
  };

  for (let i = 0; i < 96; i++) {
    const daysAgo = next(170);
    const date = new Date(today.getTime() - daysAgo * DAY);
    const roll = next(100);
    const status = roll < 48 ? 'Applied' : roll < 58 ? 'Screening' : roll < 66 ? 'Interview' : roll < 70 ? 'Offer' : 'Rejected';
    const company = COMPANIES[next(COMPANIES.length)];
    const position = POSITIONS[next(POSITIONS.length)];
    const job: Job = { id: i + 1, company, position, date: date.toISOString().slice(0, 10), status };
    jobs.push(job);

    if (status !== 'Applied') {
      const replyDays = 3 + next(Math.max(2, 18 - Math.floor(daysAgo / 14)));
      history.push({
        id: history.length + 1,
        jobId: job.id,
        company,
        position,
        previousStatus: 'Applied',
        newStatus: status,
        changedAt: new Date(date.getTime() + replyDays * DAY).toISOString()
      });
    }
  }
  return { jobs, history };
}

const sample = buildSampleData();

const fakeStore = {
  jobs: signal<Job[]>(sample.jobs),
  statusConfigs: signal<JobStatusConfig[]>(STATUS_CONFIGS)
};

const fakeApi = {
  getJobStatusHistory: (): Observable<JobStatusHistoryEntry[]> => of(sample.history)
};

@Component({
  selector: 'app-harness',
  standalone: true,
  imports: [StatisticsComponent],
  template: `<div class="harness-shell"><app-statistics /></div>`,
  styles: [`
    .harness-shell {
      display: flex;
      min-height: 100vh;
      padding: 1.25rem;
      background-color: var(--clr-bg);
    }
  `]
})
class HarnessComponent { }

bootstrapApplication(HarnessComponent, {
  providers: [
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient) => new TranslateHttpLoader(http, '/assets/i18n/', '.json'),
          deps: [HttpClient]
        }
      })
    ),
    { provide: JobStoreService, useValue: fakeStore },
    { provide: JobApiService, useValue: fakeApi },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TranslateService],
      useFactory: (translate: TranslateService) => () => {
        translate.setDefaultLang('en');
        return firstValueFrom(translate.use('en'));
      }
    }
  ]
});
