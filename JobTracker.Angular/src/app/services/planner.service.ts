import { Injectable, computed, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CalendarEvent, Task, UserDocument } from '../models/planner.model';
import { PlannerApiService, EventTypeDto } from './planner-api.service';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly _eventTypeObjects = signal<EventTypeDto[]>([]);

  private readonly _tasks = signal<Task[]>([]);

  readonly events = signal<CalendarEvent[]>([]);
  readonly tasks = computed(() =>
    [...this._tasks()].sort((a, b) => Number(a.completed) - Number(b.completed) || b.id - a.id)
  );
  readonly documents = signal<UserDocument[]>([]);
  readonly eventTypes = computed(() => this._eventTypeObjects().map(t => t.name));
  readonly loading = signal<boolean>(true);

  constructor(private readonly api: PlannerApiService) { }

  loadAll(): void {
    this.loading.set(true);

    const events$ = this.api.getEvents().pipe(tap(data => this.events.set(data)), catchError(() => of(null)));
    const tasks$ = this.api.getTasks().pipe(tap(data => this._tasks.set(data)), catchError(() => of(null)));
    const documents$ = this.api.getDocuments().pipe(tap(data => this.documents.set(data)), catchError(() => of(null)));
    const eventTypes$ = this.api.getEventTypes().pipe(tap(data => this._eventTypeObjects.set(data)), catchError(() => of(null)));

    forkJoin([events$, tasks$, documents$, eventTypes$]).subscribe(() => this.loading.set(false));
  }

  addEvent(data: Omit<CalendarEvent, 'id'>): void {
    this.api.createEvent(data).subscribe(created =>
      this.events.update(prev => [created, ...prev])
    );
  }

  updateEvent(id: number, data: Omit<CalendarEvent, 'id'>): void {
    this.api.updateEvent(id, data).subscribe(updated =>
      this.events.update(prev => prev.map(e => e.id === id ? updated : e))
    );
  }

  deleteEvent(id: number): void {
    this.api.deleteEvent(id).subscribe(() =>
      this.events.update(prev => prev.filter(e => e.id !== id))
    );
  }

  addTask(text: string): void {
    this.api.createTask(text).subscribe(created =>
      this._tasks.update(prev => [created, ...prev])
    );
  }

  toggleTask(id: number): void {
    this.api.toggleTask(id).subscribe(updated =>
      this._tasks.update(prev => prev.map(t => t.id === id ? { ...t, completed: updated.completed } : t))
    );
  }

  deleteTask(id: number): void {
    this.api.deleteTask(id).subscribe(() =>
      this._tasks.update(prev => prev.filter(t => t.id !== id))
    );
  }

  addDocument(data: Omit<UserDocument, 'id' | 'updated' | 'hasFile' | 'fileName'>): void {
    this.api.createDocument(data).subscribe(created =>
      this.documents.update(prev => [created, ...prev])
    );
  }

  addDocumentWithFile(data: Omit<UserDocument, 'id' | 'updated' | 'hasFile' | 'fileName'>, file?: File): void {
    this.api.createDocument(data).subscribe(created => {
      this.documents.update(prev => [created, ...prev]);
      if (file) {
        this.api.uploadDocumentFile(created.id, file).subscribe(updated =>
          this.documents.update(prev => prev.map(d => d.id === created.id ? updated : d))
        );
      }
    });
  }

  uploadDocumentFile(id: number, file: File, onDone?: () => void): void {
    this.api.uploadDocumentFile(id, file).subscribe({
      next: updated => {
        this.documents.update(prev => prev.map(d => d.id === id ? updated : d));
        onDone?.();
      },
      error: () => onDone?.()
    });
  }

  downloadDocumentFile(id: number, fileName: string): void {
    this.api.downloadDocumentFile(id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  deleteDocument(id: number): void {
    this.api.deleteDocument(id).subscribe(() =>
      this.documents.update(prev => prev.filter(d => d.id !== id))
    );
  }

  addEventType(type: string, color: string): void {
    const trimmed = type.trim();
    if (!trimmed) return;
    if (this._eventTypeObjects().some(t => t.name === trimmed)) return;
    this.api.createEventType(trimmed, color).subscribe(created =>
      this._eventTypeObjects.update(prev => [...prev, created])
    );
  }

  updateEventType(oldName: string, newName: string, color: string): void {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const obj = this._eventTypeObjects().find(t => t.name === oldName);
    if (!obj || (trimmed === obj.name && color === obj.color)) return;
    this.api.updateEventType(obj.id, trimmed, color).subscribe(updated => {
      this._eventTypeObjects.update(prev => prev.map(t => t.id === obj.id ? updated : t));
      if (oldName !== trimmed) {
        this.events.update(prev => prev.map(e => e.type === oldName ? { ...e, type: trimmed } : e));
      }
    });
  }

  deleteEventType(name: string): void {
    const obj = this._eventTypeObjects().find(t => t.name === name);
    if (!obj) return;
    this.api.deleteEventType(obj.id).subscribe(() =>
      this._eventTypeObjects.update(prev => prev.filter(t => t.id !== obj.id))
    );
  }

  eventTypeColor(name: string): string {
    return this._eventTypeObjects().find(t => t.name === name)?.color ?? '#26ac00';
  }

  eventTypeColorAlpha(name: string, alpha: number): string {
    const hex = this.eventTypeColor(name).replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
