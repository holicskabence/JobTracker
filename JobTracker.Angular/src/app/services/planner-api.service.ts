import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { CalendarEvent, Task, UserDocument, EVENT_TYPES } from '../models/planner.model';

export interface EventTypeDto { id: number; name: string; }

const FALLBACK_EVENTS: CalendarEvent[] = [
  { id: 1, type: 'Technikai Interjú', company: 'Google', date: '2026-06-12', time: '14:00', notes: 'Google Meet link a naptárban.' },
  { id: 2, type: 'HR Megkeresés', company: 'Stripe', date: '2026-06-18', time: '10:30', notes: 'Ismerkedő beszélgetés a toborzóval.' },
];

const FALLBACK_TASKS: Task[] = [
  { id: 1, text: 'Leetcode gyakorlás (szekvenciális tömbök)', completed: true },
  { id: 2, text: 'Google portfólió-prezentáció finomítása', completed: false },
  { id: 3, text: 'Köszönőlevél küldése a Spotify interjú után', completed: true },
  { id: 4, text: 'LinkedIn profil frissítése a legutóbbi projekttel', completed: false },
];

const FALLBACK_DOCS: UserDocument[] = [
  { id: 1, name: 'Kovacs_Bence_Frontend_CV_2026_HU.pdf', type: 'Önéletrajz', updated: '2026-05-20', version: 'v2.4' },
  { id: 2, name: 'Kovacs_Bence_Senior_Developer_EN.pdf', type: 'Önéletrajz', updated: '2026-06-01', version: 'v3.0' },
  { id: 3, name: 'Standard_Motivacios_Level_HUN.docx', type: 'Kísérőlevél', updated: '2026-04-10', version: 'v1.1' },
];

const FALLBACK_EVENT_TYPES: EventTypeDto[] = EVENT_TYPES.map((name, id) => ({ id: id + 1, name }));

@Injectable({ providedIn: 'root' })
export class PlannerApiService {
  constructor(private readonly http: HttpClient) { }

  getEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>('/api/events').pipe(
      catchError(() => of(FALLBACK_EVENTS))
    );
  }

  createEvent(data: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>('/api/events', data).pipe(
      catchError(() => of({ ...data, id: Date.now() }))
    );
  }

  updateEvent(id: number, data: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent> {
    return this.http.put<CalendarEvent>(`/api/events/${id}`, data).pipe(
      catchError(() => of({ ...data, id }))
    );
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`/api/events/${id}`).pipe(catchError(() => of(undefined)));
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>('/api/tasks').pipe(
      catchError(() => of(FALLBACK_TASKS))
    );
  }

  createTask(text: string): Observable<Task> {
    return this.http.post<Task>('/api/tasks', { text }).pipe(
      catchError(() => of({ id: Date.now(), text, completed: false }))
    );
  }

  toggleTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`/api/tasks/${id}/toggle`, {});
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`).pipe(catchError(() => of(undefined)));
  }

  getDocuments(): Observable<UserDocument[]> {
    return this.http.get<UserDocument[]>('/api/documents').pipe(
      catchError(() => of(FALLBACK_DOCS))
    );
  }

  createDocument(data: Omit<UserDocument, 'id' | 'updated'>): Observable<UserDocument> {
    return this.http.post<UserDocument>('/api/documents', data).pipe(
      catchError(() => of({ ...data, id: Date.now(), updated: new Date().toISOString().split('T')[0] }))
    );
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`/api/documents/${id}`).pipe(catchError(() => of(undefined)));
  }

  getEventTypes(): Observable<EventTypeDto[]> {
    return this.http.get<EventTypeDto[]>('/api/event-types').pipe(
      catchError(() => of(FALLBACK_EVENT_TYPES))
    );
  }

  createEventType(name: string): Observable<EventTypeDto> {
    return this.http.post<EventTypeDto>('/api/event-types', { name }).pipe(
      catchError(() => of({ id: Date.now(), name }))
    );
  }

  deleteEventType(id: number): Observable<void> {
    return this.http.delete<void>(`/api/event-types/${id}`).pipe(catchError(() => of(undefined)));
  }
}
