import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlannerService } from '../../services/planner.service';
import { CalendarEvent } from '../../models/planner.model';
import { SelectDropdownComponent } from '../shared/select-dropdown/select-dropdown.component';
import { DatePickerComponent } from '../shared/date-picker/date-picker.component';
import { TimePickerComponent } from '../shared/time-picker/time-picker.component';
import { CardComponent } from '../shared/card/card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { BreakpointService } from '../../services/breakpoint.service';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { eventColor, eventColorAlpha } from '../../utils/event-color.util';

type EventFilter = 'all' | 'upcoming' | 'past';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, SelectDropdownComponent, DatePickerComponent, TimePickerComponent, CardComponent, EmptyStateComponent, TranslateModule, PageSectionComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  readonly planner = inject(PlannerService);
  readonly breakpoint = inject(BreakpointService);
  private readonly translate = inject(TranslateService);

  readonly eventFilter   = signal<EventFilter>('all');
  readonly hideCompleted = signal(false);
  readonly editingId     = signal<number | null>(null);
  readonly formOpen      = signal(false);

  @ViewChild('eventsFormCard') private eventsFormCard?: ElementRef<HTMLElement>;

  readonly completedCount = computed(() => this.planner.tasks().filter(t => t.completed).length);

  readonly filteredEvents = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const evs   = this.planner.events();
    let filtered = evs;
    if (this.eventFilter() === 'upcoming') filtered = evs.filter(e => e.date >= today);
    else if (this.eventFilter() === 'past') filtered = evs.filter(e => e.date < today);
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  });

  readonly visibleTasks = computed(() => {
    const tasks = this.planner.tasks();
    return this.hideCompleted() ? tasks.filter(t => !t.completed) : tasks;
  });

  readonly emptyEventsMessage = computed(() => {
    const filter = this.eventFilter();
    if (filter === 'upcoming') return this.translate.instant('events.list.emptyUpcoming');
    if (filter === 'past') return this.translate.instant('events.list.emptyPast');
    return this.translate.instant('events.list.emptyAll');
  });

  newEventType    = '';
  newEventCompany = '';
  newEventDate    = '';
  newEventTime    = '';
  newEventNotes   = '';
  submitted       = false;

  newTaskText = '';

  ngOnInit(): void {
    this.newEventType = this.planner.eventTypes()[0] ?? '';
  }

  startEdit(ev: CalendarEvent): void {
    this.editingId.set(ev.id);
    this.newEventType    = ev.type;
    this.newEventCompany = ev.company;
    this.newEventDate    = ev.date;
    this.newEventTime    = ev.time;
    this.newEventNotes   = ev.notes;
    this.submitted       = false;
    this.formOpen.set(true);

    if (!this.breakpoint.isMobile()) {
      this.eventsFormCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.formOpen.set(false);
    this.resetForm();
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.resetForm();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  submitEvent(): void {
    this.submitted = true;
    if (!this.newEventCompany.trim() || !this.newEventDate) return;

    const data = {
      type:    this.newEventType || (this.planner.eventTypes()[0] ?? ''),
      company: this.newEventCompany.trim(),
      date:    this.newEventDate,
      time:    this.newEventTime,
      notes:   this.newEventNotes.trim()
    };

    const id = this.editingId();
    if (id !== null) {
      this.planner.updateEvent(id, data);
      this.editingId.set(null);
    } else {
      this.planner.addEvent(data);
    }
    this.formOpen.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.newEventCompany = '';
    this.newEventDate    = '';
    this.newEventTime    = '';
    this.newEventNotes   = '';
    this.newEventType    = this.planner.eventTypes()[0] ?? '';
    this.submitted       = false;
  }

  submitTask(): void {
    if (!this.newTaskText.trim()) return;
    this.planner.addTask(this.newTaskText.trim());
    this.newTaskText = '';
  }

  eventTimeLabel(ev: CalendarEvent): string {
    return ev.time || this.translate.instant('events.list.allDay');
  }

  readonly eventColor = eventColor;
  readonly eventColorAlpha = eventColorAlpha;

  initial(company: string): string {
    return company.charAt(0).toUpperCase();
  }

  fmtDateShort(d: string): string {
    return new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  fmtRelative(d: string): string {
    const target = new Date(d); target.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return this.translate.instant('events.list.relativeDate.today');
    if (diff === 1) return this.translate.instant('events.list.relativeDate.tomorrow');
    if (diff === -1) return this.translate.instant('events.list.relativeDate.yesterday');
    if (diff > 1 && diff <= 7) return this.translate.instant('events.list.relativeDate.inDays', { count: diff });
    if (diff < -1 && diff >= -7) return this.translate.instant('events.list.relativeDate.daysAgo', { count: -diff });
    return this.fmtDateShort(d);
  }
}
