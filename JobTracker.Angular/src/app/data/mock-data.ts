import { Job, MonthlyStatsPoint } from '../models/job.model';

export const INITIAL_JOBS: Job[] = [
  {
    id: 1,
    company: 'Google',
    position: 'Frontend Engineer',
    link: 'careers.google.com',
    date: '2026-05-10',
    status: 'Visszahivas'
  },
  {
    id: 2,
    company: 'Spotify',
    position: 'Angular Developer',
    link: 'spotify.jobs',
    date: '2026-05-22',
    status: 'Ajanlat'
  },
  {
    id: 3,
    company: 'Stripe',
    position: 'UI Engineer',
    link: 'stripe.com/jobs',
    date: '2026-06-01',
    status: 'Beadva'
  },
  {
    id: 4,
    company: 'Netflix',
    position: 'Senior Web Developer',
    link: 'jobs.netflix.com',
    date: '2026-06-03',
    status: 'Mentett'
  },
  {
    id: 5,
    company: 'Meta',
    position: 'Product Engineer',
    link: 'metacareers.com',
    date: '2026-04-15',
    status: 'Elutasitva'
  },
  {
    id: 6,
    company: 'Vercel',
    position: 'Frontend Architect',
    link: 'vercel.com/careers',
    date: '2026-05-28',
    status: 'Visszahivas'
  },
  {
    id: 7,
    company: 'Linear',
    position: 'Software Engineer',
    link: 'linear.app/jobs',
    date: '2026-06-04',
    status: 'Beadva'
  }
];

export const MONTHLY_STATS: MonthlyStatsPoint[] = [
  { month: 'Jan', submitted: 2, callbacks: 0 },
  { month: 'Feb', submitted: 4, callbacks: 1 },
  { month: 'Mar', submitted: 6, callbacks: 2 },
  { month: 'Apr', submitted: 5, callbacks: 2 },
  { month: 'May', submitted: 9, callbacks: 4 },
  { month: 'Jun', submitted: 4, callbacks: 2 }
];
