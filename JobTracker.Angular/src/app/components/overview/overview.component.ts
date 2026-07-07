import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { JobStoreService } from '../../services/job-store.service';
import { PlannerService } from '../../services/planner.service';
import { PracticeService } from '../../services/practice.service';
import { AuthService } from '../../services/auth.service';
import { DashboardTab } from '../../models/job.model';
import { CardComponent } from '../shared/card/card.component';
import { BadgeComponent } from '../shared/badge/badge.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CardComponent, BadgeComponent, EmptyStateComponent, TranslateModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent {
  private readonly router = inject(Router);
  readonly store = inject(JobStoreService);
  readonly planner = inject(PlannerService);
  readonly practice = inject(PracticeService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  navigate(tab: DashboardTab): void {
    this.router.navigate(['/dashboard', tab]);
  }

  readonly stats = this.store.stats;
  readonly recentJobs = computed(() => this.store.jobs().slice(0, 5));
  readonly goal = computed(() => this.auth.currentUser()?.goal ?? 50);
  readonly progressWidth = computed(() =>
    Math.min((this.store.stats().totalJobs / this.goal()) * 100, 100)
  );
  readonly callbackRate = computed(() => {
    const s = this.stats();
    return s.totalJobs > 0 ? Math.round((s.callbacks / s.totalJobs) * 100) : 0;
  });

  readonly upcomingEvents = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const events = this.planner.events();
    const future = events
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = events
      .filter(e => new Date(e.date) < today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return [...future, ...past].slice(0, 3);
  });

  readonly quickTasks = computed(() => {
    const tasks = this.planner.tasks();
    const active = tasks.filter(t => !t.completed);
    if (active.length >= 3) return active.slice(0, 3);
    const completed = tasks.filter(t => t.completed);
    return [...active, ...completed].slice(0, 3);
  });
  readonly tasksDone = computed(() => this.planner.tasks().filter(t => t.completed).length);
  readonly tasksTotal = computed(() => this.planner.tasks().length);

  readonly coachTip = computed(() => {
    const s = this.store.stats();
    const soon = this.upcomingEvents().filter(e => {
      const diff = (new Date(e.date).getTime() - Date.now()) / 86_400_000;
      return diff >= 0 && diff <= 7;
    });

    if (soon.length) {
      const ev = soon[0];
      return {
        emoji: '🎯',
        title: this.translate.instant('overview.coachTip.prepTime.title'),
        text: this.translate.instant('overview.coachTip.prepTime.text', { company: ev.company, type: ev.type, date: this.fmtDate(ev.date) }),
        cta: this.translate.instant('overview.coachTip.prepTime.cta'),
        tab: 'esemenyek' as DashboardTab
      };
    }
    if (s.callbacks > 0) {
      return {
        emoji: '📞',
        title: this.translate.instant('overview.coachTip.callback.title'),
        text: this.translate.instant('overview.coachTip.callback.text', { count: s.callbacks }),
        cta: this.translate.instant('overview.coachTip.callback.cta'),
        tab: 'jelentkezesek' as DashboardTab
      };
    }
    if (s.totalJobs < 5) {
      return {
        emoji: '🚀',
        title: this.translate.instant('overview.coachTip.startSearch.title'),
        text: this.translate.instant('overview.coachTip.startSearch.text'),
        cta: this.translate.instant('overview.coachTip.startSearch.cta'),
        tab: 'jelentkezesek' as DashboardTab
      };
    }
    if (s.successRate === 0 && s.totalJobs >= 5) {
      return {
        emoji: '⏳',
        title: this.translate.instant('overview.coachTip.patience.title'),
        text: this.translate.instant('overview.coachTip.patience.text', { count: s.totalJobs }),
        cta: this.translate.instant('overview.coachTip.patience.cta'),
        tab: 'jelentkezesek' as DashboardTab
      };
    }
    return {
      emoji: '💪',
      title: this.translate.instant('overview.coachTip.goodProgress.title'),
      text: this.translate.instant('overview.coachTip.goodProgress.text', { count: s.totalJobs, rate: s.successRate }),
      cta: this.translate.instant('overview.coachTip.goodProgress.cta'),
      tab: 'jelentkezesek' as DashboardTab
    };
  });

  readonly weeklyStats = computed(() => {
    const jobs = this.store.jobs();
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const thisWeek = jobs.filter(j => new Date(j.date.split('T')[0]) >= monday).length;
    const goal = 5;
    return { thisWeek, goal, percent: Math.min((thisWeek / goal) * 100, 100) };
  });

  readonly streak = computed(() => {
    const jobs = this.store.jobs();
    if (!jobs.length) return 0;
    const dateSet = new Set(jobs.map(j => j.date.split('T')[0]));
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (dateSet.has(d.toISOString().split('T')[0])) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  });

  readonly streakLabel = computed(() => {
    const n = this.streak();
    if (n === 0) return this.translate.instant('overview.streak.none');
    if (n === 1) return this.translate.instant('overview.streak.firstDay');
    if (n < 5) return this.translate.instant('overview.streak.short', { count: n });
    if (n < 14) return this.translate.instant('overview.streak.medium', { count: n });
    return this.translate.instant('overview.streak.long', { count: n });
  });

  private readonly EVENT_COLORS: Record<string, string> = {
    'HR Megkeresés': '#f59e0b',
    'Technikai Interjú': '#5fb9fa',
    'Rendszertervezés': '#8b5cf6',
    'Tesztfeladat': '#f97316',
    'Ajánlat egyeztetés': '#26ac00'
  };

  eventColor(type: string): string {
    return this.EVENT_COLORS[type] ?? '#26ac00';
  }

  eventColorAlpha(type: string, a: number): string {
    const hex = this.eventColor(type).replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' });
  }

  fmtRelative(d: string): string {
    const target = new Date(d); target.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return this.translate.instant('overview.relativeDate.today');
    if (diff === 1) return this.translate.instant('overview.relativeDate.tomorrow');
    if (diff === -1) return this.translate.instant('overview.relativeDate.yesterday');
    if (diff > 1 && diff <= 7) return this.translate.instant('overview.relativeDate.inDays', { count: diff });
    if (diff < -1 && diff >= -7) return this.translate.instant('overview.relativeDate.daysAgo', { count: -diff });
    return new Date(d).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' });
  }

  readonly practiceStreakLabel = computed(() => {
    const days = this.practice.lastPracticedDaysAgo();
    if (days === null) return this.translate.instant('overview.practiceStreak.never');
    if (days === 0) return this.translate.instant('overview.practiceStreak.today');
    if (days === 1) return this.translate.instant('overview.practiceStreak.yesterday');
    if (days <= 3) return this.translate.instant('overview.practiceStreak.few', { count: days });
    return this.translate.instant('overview.practiceStreak.many', { count: days });
  });

  readonly readinessColor = computed(() => {
    const s = this.practice.readinessScore();
    if (s >= 80) return '#26ac00';
    if (s >= 60) return '#5fb9fa';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  });

  readonly readinessLabel = computed(() => {
    const s = this.practice.readinessScore();
    if (s >= 80) return this.translate.instant('overview.readiness.excellent');
    if (s >= 60) return this.translate.instant('overview.readiness.good');
    if (s >= 40) return this.translate.instant('overview.readiness.improvable');
    return this.translate.instant('overview.readiness.beginner');
  });

  initial(s: string): string { return s.charAt(0).toUpperCase(); }
  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number) { return this.store.colorAlpha(status, a); }
  statusLabel(status: string): string { return this.store.labelFor(status); }
  toggleTask(id: number): void { this.planner.toggleTask(id); }
}
