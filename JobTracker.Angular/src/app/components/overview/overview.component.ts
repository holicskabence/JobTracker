import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { JobStoreService } from '../../services/job-store.service';
import { PlannerService } from '../../services/planner.service';
import { PracticeService } from '../../services/practice.service';
import { DashboardTab } from '../../models/job.model';
import { CardComponent } from '../shared/card/card.component';
import { BadgeComponent } from '../shared/badge/badge.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CardComponent, BadgeComponent, EmptyStateComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent {
  private readonly router = inject(Router);
  readonly store = inject(JobStoreService);
  readonly planner = inject(PlannerService);
  readonly practice = inject(PracticeService);

  navigate(tab: DashboardTab): void {
    this.router.navigate(['/dashboard', tab]);
  }

  readonly stats = this.store.stats;
  readonly recentJobs = computed(() => this.store.jobs().slice(0, 4));
  readonly progressWidth = computed(() =>
    Math.min((this.store.stats().totalJobs / 50) * 100, 100)
  );

  readonly upcomingEvents = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.planner.events()
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  });

  readonly quickTasks = computed(() => this.planner.tasks().slice(0, 4));
  readonly tasksDone = computed(() => this.planner.tasks().filter(t => t.completed).length);
  readonly tasksTotal = computed(() => this.planner.tasks().length);

  readonly coachTip = computed(() => {
    const s = this.store.stats();
    const soon = this.upcomingEvents().filter(e => {
      const diff = (new Date(e.date).getTime() - Date.now()) / 86_400_000;
      return diff <= 7;
    });

    if (soon.length) {
      const ev = soon[0];
      return {
        emoji: '🎯',
        title: 'Felkészülési idő!',
        text: `${ev.company} – ${ev.type} közeleg (${this.fmtDate(ev.date)}). Nézd át a noteszed, készítsd elő a kérdéseidet.`,
        cta: 'Eseményekhez',
        tab: 'esemenyek' as DashboardTab
      };
    }
    if (s.callbacks > 0) {
      return {
        emoji: '📞',
        title: 'Van visszahívásod!',
        text: `${s.callbacks} aktív visszahívás vár rád. A gyors reagálás sokat számít a kiválasztásnál.`,
        cta: 'Megnézem',
        tab: 'jelentkezesek' as DashboardTab
      };
    }
    if (s.totalJobs < 5) {
      return {
        emoji: '🚀',
        title: 'Indítsd be a keresést!',
        text: 'Még kevés a jelentkezésed. Napi 2–3 célzott pályázat a leghatékonyabb stratégia – kezdd el ma!',
        cta: 'Jelentkezések',
        tab: 'jelentkezesek' as DashboardTab
      };
    }
    if (s.successRate === 0 && s.totalJobs >= 5) {
      return {
        emoji: '⏳',
        title: 'Türelem – a folyamat halad!',
        text: `${s.totalJobs} pályázatod van útban. Frissítsd a LinkedIn profilod és kövesd fel a cégeket egy héttel az interjú után.`,
        cta: 'Összes megtekintése',
        tab: 'jelentkezesek' as DashboardTab
      };
    }
    return {
      emoji: '💪',
      title: 'Jól haladsz!',
      text: `${s.totalJobs} jelentkezéssel, ${s.successRate}%-os sikerrátával komoly keresés folyik. Tartsd fenn a lendületet!`,
      cta: 'Összes megtekintése',
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
    if (n === 0) return 'Ma még nem volt jelentkezés';
    if (n === 1) return 'Első nap – csináld holnap is!';
    if (n < 5) return `${n} napos streak – hajtás!`;
    if (n < 14) return `${n} napos streak! 🔥`;
    return `${n} napos streak! 🔥🔥`;
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
    if (diff === 0) return 'Ma';
    if (diff === 1) return 'Holnap';
    if (diff <= 7) return `${diff} nap múlva`;
    return new Date(d).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' });
  }

  readonly practiceStreakLabel = computed(() => {
    const days = this.practice.lastPracticedDaysAgo();
    if (days === null) return 'Még nem gyakoroltál';
    if (days === 0) return 'Ma gyakoroltál! 🔥';
    if (days === 1) return 'Tegnap – folytasd ma!';
    if (days <= 3) return `${days} napja nem volt gyakorlás`;
    return `${days} napja nem gyakoroltál – ideje visszatérni!`;
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
    if (s >= 80) return 'Kiváló';
    if (s >= 60) return 'Jó';
    if (s >= 40) return 'Fejleszthető';
    return 'Kezdő';
  });

  initial(s: string): string { return s.charAt(0).toUpperCase(); }
  colorFor(status: string): string { return this.store.colorFor(status); }
  colorAlpha(status: string, a: number) { return this.store.colorAlpha(status, a); }
  statusLabel(status: string): string { return this.store.labelFor(status); }
  toggleTask(id: number): void { this.planner.toggleTask(id); }
}
