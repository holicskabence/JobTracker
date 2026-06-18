import { Injectable, computed, signal } from '@angular/core';
import { CalendarEvent, Task, UserDocument } from '../models/planner.model';
import { PlannerApiService, EventTypeDto } from './planner-api.service';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly _eventTypeObjects = signal<EventTypeDto[]>([]);

  readonly events = signal<CalendarEvent[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly documents = signal<UserDocument[]>([]);
  readonly eventTypes = computed(() => this._eventTypeObjects().map(t => t.name));

  readonly upcomingInterviewCount = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.events().filter(e =>
      e.type.toLowerCase().includes('interj') && new Date(e.date) >= today
    ).length;
  });

  constructor(private readonly api: PlannerApiService) { }

  loadAll(): void {
    this.api.getEvents().subscribe({ next: data => this.events.set(data) });
    this.api.getTasks().subscribe({ next: data => this.tasks.set(data) });
    this.api.getDocuments().subscribe({ next: data => this.documents.set(data) });
    this.api.getEventTypes().subscribe({ next: data => this._eventTypeObjects.set(data) });
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
      this.tasks.update(prev => [...prev, created])
    );
  }

  toggleTask(id: number): void {
    this.api.toggleTask(id).subscribe(updated =>
      this.tasks.update(prev => prev.map(t => t.id === id ? { ...t, completed: updated.completed } : t))
    );
  }

  deleteTask(id: number): void {
    this.api.deleteTask(id).subscribe(() =>
      this.tasks.update(prev => prev.filter(t => t.id !== id))
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

  addEventType(type: string): void {
    const trimmed = type.trim();
    if (!trimmed) return;
    if (this._eventTypeObjects().some(t => t.name === trimmed)) return;
    this.api.createEventType(trimmed).subscribe(created =>
      this._eventTypeObjects.update(prev => [...prev, created])
    );
  }

  updateEventType(oldName: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const obj = this._eventTypeObjects().find(t => t.name === oldName);
    if (!obj || trimmed === obj.name) return;
    this.api.updateEventType(obj.id, trimmed).subscribe(updated => {
      this._eventTypeObjects.update(prev => prev.map(t => t.id === obj.id ? updated : t));
      this.events.update(prev => prev.map(e => e.type === oldName ? { ...e, type: trimmed } : e));
    });
  }

  deleteEventType(name: string): void {
    const obj = this._eventTypeObjects().find(t => t.name === name);
    if (!obj) return;
    this.api.deleteEventType(obj.id).subscribe(() =>
      this._eventTypeObjects.update(prev => prev.filter(t => t.id !== obj.id))
    );
  }
}
