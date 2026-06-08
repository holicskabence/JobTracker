import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        notifications.error(extractErrorMessage(err));
      }
      return throwError(() => err);
    })
  );
};

function extractErrorMessage(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot.';
  }

  const body = err.error;
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;

    if (body.errors && typeof body.errors === 'object') {
      const firstError = Object.values<unknown>(body.errors)[0];
      if (Array.isArray(firstError) && typeof firstError[0] === 'string') return firstError[0];
    }

    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }

  switch (err.status) {
    case 400: return 'Hibás vagy hiányos adatok érkeztek.';
    case 401: return 'A művelethez bejelentkezés szükséges.';
    case 403: return 'Nincs jogosultságod a művelet végrehajtásához.';
    case 404: return 'A keresett erőforrás nem található.';
    case 409: return 'A művelet ütközik egy meglévő elemmel.';
    default: return 'Hiba történt a kérés feldolgozása közben.';
  }
}
