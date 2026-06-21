import {
  Component, computed, ElementRef, HostListener,
  Input, Output, EventEmitter, signal, inject
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css'
})
export class DatePickerComponent {
  private readonly translate = inject(TranslateService);

  @Input() value = '';
  @Input() placeholder = 'shared.dateTimePicker.selectDatePlaceholder';
  @Input() hasError = false;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  panelTop = 0;
  panelBottom = 0;
  panelLeft = 0;
  openUpward = false;

  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth());

  readonly MONTH_KEYS = [
    'shared.dateTimePicker.month.january', 'shared.dateTimePicker.month.february', 'shared.dateTimePicker.month.march',
    'shared.dateTimePicker.month.april', 'shared.dateTimePicker.month.may', 'shared.dateTimePicker.month.june',
    'shared.dateTimePicker.month.july', 'shared.dateTimePicker.month.august', 'shared.dateTimePicker.month.september',
    'shared.dateTimePicker.month.october', 'shared.dateTimePicker.month.november', 'shared.dateTimePicker.month.december'
  ];
  readonly WEEKDAY_KEYS = [
    'shared.dateTimePicker.weekday.mon', 'shared.dateTimePicker.weekday.tue', 'shared.dateTimePicker.weekday.wed',
    'shared.dateTimePicker.weekday.thu', 'shared.dateTimePicker.weekday.fri', 'shared.dateTimePicker.weekday.sat',
    'shared.dateTimePicker.weekday.sun'
  ];

  monthLabel(month: number): string {
    return this.MONTH_KEYS[month];
  }

  readonly calendarDays = computed(() => {
    const y = this.viewYear(), m = this.viewMonth();
    const firstDow = ((new Date(y, m, 1).getDay() + 6) % 7); // Mon = 0
    const daysCount = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = new Array(firstDow).fill(null);
    for (let d = 1; d <= daysCount; d++) cells.push(d);
    return cells;
  });

  constructor(private readonly elRef: ElementRef) { }

  get formatted(): string {
    if (!this.value) return '';
    const [y, m, d] = this.value.split('-').map(Number);
    return `${y}. ${this.translate.instant(this.MONTH_KEYS[m - 1])} ${d}.`;
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen) { this.isOpen = false; return; }
    if (this.value) {
      const [y, m] = this.value.split('-').map(Number);
      this.viewYear.set(y);
      this.viewMonth.set(m - 1);
    }
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const panelWidth = 292;
    const panelHeight = 340;
    const margin = 8;

    let left = r.left;
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - panelWidth - margin;
    }
    if (left < margin) left = margin;

    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;

    this.openUpward = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    if (this.openUpward) {
      this.panelBottom = window.innerHeight - r.top + 6;
    } else {
      this.panelTop = r.bottom + 6;
    }
    this.panelLeft = left;
    this.isOpen = true;
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) { this.viewYear.update(y => y - 1); this.viewMonth.set(11); }
    else { this.viewMonth.update(m => m - 1); }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) { this.viewYear.update(y => y + 1); this.viewMonth.set(0); }
    else { this.viewMonth.update(m => m + 1); }
  }

  pick(day: number, event: MouseEvent): void {
    event.stopPropagation();
    const m = String(this.viewMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    this.valueChange.emit(`${this.viewYear()}-${m}-${d}`);
    this.isOpen = false;
  }

  isSelected(day: number): boolean {
    if (!this.value) return false;
    const [y, m, d] = this.value.split('-').map(Number);
    return y === this.viewYear() && m === this.viewMonth() + 1 && d === day;
  }

  isToday(day: number): boolean {
    const t = new Date();
    return t.getFullYear() === this.viewYear() &&
      t.getMonth() === this.viewMonth() &&
      t.getDate() === day;
  }

  @HostListener('document:click')
  onDocClick(): void { this.isOpen = false; }
}
