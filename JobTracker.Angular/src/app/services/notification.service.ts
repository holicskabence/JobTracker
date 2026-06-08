import { Injectable, signal } from '@angular/core';

export type NotificationType = 'error' | 'info' | 'success';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const AUTO_DISMISS_MS = 6000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  private nextId = 1;

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  success(message: string): void {
    this.push('success', message);
  }

  dismiss(id: number): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  private push(type: NotificationType, message: string): void {
    if (this._notifications().some(n => n.type === type && n.message === message)) return;

    const notification: AppNotification = { id: this.nextId++, type, message };
    this._notifications.update(list => [...list, notification]);
    setTimeout(() => this.dismiss(notification.id), AUTO_DISMISS_MS);
  }
}
