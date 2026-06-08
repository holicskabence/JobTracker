import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlannerService } from '../../services/planner.service';
import { CalendarEvent } from '../../models/planner.model';
import { SelectDropdownComponent } from '../shared/select-dropdown/select-dropdown.component';
import { DatePickerComponent } from '../shared/date-picker/date-picker.component';
import { TimePickerComponent } from '../shared/time-picker/time-picker.component';

type EventFilter = 'all' | 'upcoming' | 'past';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [FormsModule, SelectDropdownComponent, DatePickerComponent, TimePickerComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  readonly planner = inject(PlannerService);

  readonly eventFilter   = signal<EventFilter>('all');
  readonly hideCompleted = signal(false);
  readonly editingId     = signal<number | null>(null);

  readonly completedCount = computed(() => this.planner.tasks().filter(t => t.completed).length);

  readonly filteredEvents = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const evs   = this.planner.events();
    if (this.eventFilter() === 'upcoming') return evs.filter(e => e.date >= today);
    if (this.eventFilter() === 'past')     return evs.filter(e => e.date < today);
    return evs;
  });

  readonly visibleTasks = computed(() => {
    const tasks = this.planner.tasks();
    return this.hideCompleted() ? tasks.filter(t => !t.completed) : tasks;
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
  }

  cancelEdit(): void {
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
}
