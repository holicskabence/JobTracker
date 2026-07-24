import { AfterViewInit, Component, ElementRef, NgZone, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { gsap } from 'gsap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { JobStoreService } from '../../../services/job-store.service';

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
  isFuture: boolean;
}

export interface HeatmapWeek {
  days: HeatmapDay[];
}

interface MonthLabel {
  label: string;
  left: number;
}

const WEEKS_IN_GRID = 53;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const TOOLTIP_WIDTH = 150;

@Component({
  selector: 'app-activity-heatmap',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './activity-heatmap.component.html',
  styleUrl: './activity-heatmap.component.css'
})
export class ActivityHeatmapComponent implements AfterViewInit {
  private readonly store = inject(JobStoreService);
  private readonly translate = inject(TranslateService);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  readonly CELL_SIZE = CELL_SIZE;
  readonly CELL_GAP = CELL_GAP;

  private readonly i18nTick = signal(0);

  readonly hovered = signal<HeatmapDay | null>(null);
  readonly tooltipLeft = signal(0);
  readonly tooltipTop = signal(0);

  readonly weeks = computed<HeatmapWeek[]>(() => {
    const byDate = new Map<string, number>();
    for (const job of this.store.jobs()) {
      byDate.set(job.date, (byDate.get(job.date) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDow = (today.getDay() + 6) % 7;
    const thisMonday = new Date(today);
    thisMonday.setDate(thisMonday.getDate() - todayDow);

    const gridStart = new Date(thisMonday);
    gridStart.setDate(gridStart.getDate() - (WEEKS_IN_GRID - 1) * 7);

    const weeks: HeatmapWeek[] = [];
    for (let w = 0; w < WEEKS_IN_GRID; w++) {
      const days: HeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(date.getDate() + w * 7 + d);
        const key = this.toDateKey(date);
        const count = byDate.get(key) ?? 0;
        const isFuture = date.getTime() > today.getTime();
        days.push({ date: key, count, level: this.bucket(count), isFuture });
      }
      weeks.push({ days });
    }
    return weeks;
  });

  readonly monthLabels = computed<MonthLabel[]>(() => {
    this.i18nTick();
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU';
    const weeks = this.weeks();
    const labels: MonthLabel[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const date = new Date(week.days[0].date + 'T00:00:00');
      const month = date.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: date.toLocaleDateString(locale, { month: 'short' }), left: i * (CELL_SIZE + CELL_GAP) });
        lastMonth = month;
      }
    });
    return labels;
  });

  readonly activeDaysCount = computed(() =>
    this.weeks()
      .flatMap(w => w.days)
      .filter(d => !d.isFuture && d.count > 0).length
  );

  readonly gridWidth = computed(() => WEEKS_IN_GRID * (CELL_SIZE + CELL_GAP) - CELL_GAP);

  constructor() {
    merge(this.translate.onTranslationChange, this.translate.onLangChange)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.i18nTick.update(v => v + 1));
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const cells = this.el.nativeElement.querySelectorAll('.activity-heatmap-cell');
      gsap.fromTo(
        cells,
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.35, stagger: { each: 0.0018, from: 'start' }, ease: 'power2.out' }
      );
    });
  }

  onCellEnter(day: HeatmapDay, event: Event): void {
    if (day.isFuture) return;
    this.hovered.set(day);

    const target = event.currentTarget as HTMLElement;
    const cellRect = target.getBoundingClientRect();
    const containerRect = this.el.nativeElement.getBoundingClientRect();

    const rawLeft = cellRect.left - containerRect.left + cellRect.width / 2;
    const clampedLeft = Math.max(
      TOOLTIP_WIDTH / 2,
      Math.min(containerRect.width - TOOLTIP_WIDTH / 2, rawLeft)
    );
    this.tooltipLeft.set(clampedLeft);
    this.tooltipTop.set(cellRect.top - containerRect.top);
  }

  onCellLeave(): void {
    this.hovered.set(null);
  }

  get hoveredDateLabel(): string {
    const day = this.hovered();
    if (!day) return '';
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU';
    const date = new Date(day.date + 'T00:00:00');
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private bucket(count: number): number {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
