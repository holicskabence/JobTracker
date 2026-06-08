import {
  Component, computed, ElementRef, HostListener,
  Input, Output, EventEmitter, signal
} from '@angular/core';

@Component({
  selector: 'app-date-picker',
  imports: [],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css'
})
export class DatePickerComponent {
  @Input() value = '';
  @Input() placeholder = 'Válassz dátumot…';
  @Input() hasError = false;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  panelTop = 0;
  panelLeft = 0;

  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth());

  readonly MONTHS = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
  readonly WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

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
    return `${y}. ${this.MONTHS[m - 1]} ${d}.`;
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
    this.panelTop = r.bottom + 6;
    this.panelLeft = r.left;
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
