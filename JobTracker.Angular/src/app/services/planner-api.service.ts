import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalendarEvent, Task, UserDocument } from '../models/planner.model';

export interface EventTypeDto { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class PlannerApiService {
  constructor(private readonly http: HttpClient) { }

  getEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>('/api/events');
  }

  createEvent(data: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>('/api/events', data);
  }

  updateEvent(id: number, data: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent> {
    return this.http.put<CalendarEvent>(`/api/events/${id}`, data);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`/api/events/${id}`);
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>('/api/tasks');
  }

  createTask(text: string): Observable<Task> {
    return this.http.post<Task>('/api/tasks', { text });
  }

  toggleTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`/api/tasks/${id}/toggle`, {});
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }

  getDocuments(): Observable<UserDocument[]> {
    return this.http.get<UserDocument[]>('/api/documents');
  }

  createDocument(data: Omit<UserDocument, 'id' | 'updated'>): Observable<UserDocument> {
    return this.http.post<UserDocument>('/api/documents', data);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`/api/documents/${id}`);
  }

  getEventTypes(): Observable<EventTypeDto[]> {
    return this.http.get<EventTypeDto[]>('/api/event-types');
  }

  createEventType(name: string): Observable<EventTypeDto> {
    return this.http.post<EventTypeDto>('/api/event-types', { name });
  }

  deleteEventType(id: number): Observable<void> {
    return this.http.delete<void>(`/api/event-types/${id}`);
  }
}
