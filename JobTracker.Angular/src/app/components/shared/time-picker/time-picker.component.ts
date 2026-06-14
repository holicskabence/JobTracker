import {
  AfterViewInit, Component, ElementRef, HostListener,
  Input, Output, EventEmitter, ViewChild
} from '@angular/core';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css'
})
export class TimePickerComponent implements AfterViewInit {
  @Input() value = '';
  @Input() placeholder = 'Egész nap';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('hourList') hourListRef?: ElementRef<HTMLElement>;

  isOpen = false;
  panelTop = 0;
  panelBottom = 0;
  panelLeft = 0;
  openUpward = false;

  readonly hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutes = ['00', '15', '30', '45'];

  get selectedHour(): string { return this.value ? this.value.split(':')[0] : ''; }
  get selectedMinute(): string { return this.value ? this.value.split(':')[1] : ''; }

  get formatted(): string { return this.value || ''; }

  constructor(private readonly elRef: ElementRef) { }

  ngAfterViewInit(): void { }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen) { this.isOpen = false; return; }
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const panelWidth = 196;
    const panelHeight = 290;
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
    setTimeout(() => this.scrollToSelected(), 0);
  }

  private scrollToSelected(): void {
    if (!this.hourListRef) return;
    const el = this.hourListRef.nativeElement;
    const selected = el.querySelector('.time-picker-item--sel') as HTMLElement | null;
    if (selected) {
      el.scrollTop = selected.offsetTop - el.clientHeight / 2 + selected.offsetHeight / 2;
    } else {
      el.scrollTop = 8 * 36;
    }
  }

  pickHour(h: string, event: MouseEvent): void {
    event.stopPropagation();
    const m = this.selectedMinute || '00';
    this.valueChange.emit(`${h}:${m}`);
  }

  pickMinute(m: string, event: MouseEvent): void {
    event.stopPropagation();
    const h = this.selectedHour || '09';
    this.valueChange.emit(`${h}:${m}`);
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit('');
    this.isOpen = false;
  }

  @HostListener('document:click')
  onDocClick(): void { this.isOpen = false; }
}
