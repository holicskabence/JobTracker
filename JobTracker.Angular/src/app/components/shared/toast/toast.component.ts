import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  private readonly notifications = inject(NotificationService);

  readonly items = this.notifications.notifications;

  dismiss(id: number): void {
    this.notifications.dismiss(id);
  }
}
