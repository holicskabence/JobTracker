import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 && !req.url.includes('/api/auth/') && auth.isLoggedIn()) {
          notifications.error(translate.instant('shared.toast.sessionExpired'));
          auth.logout();
        } else {
          notifications.error(extractErrorMessage(err, translate));
        }
      }
      return throwError(() => err);
    })
  );
};

function extractErrorMessage(err: HttpErrorResponse, translate: TranslateService): string {
  if (err.status === 0) {
    return translate.instant('shared.toast.errorNetwork');
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
    case 400: return translate.instant('shared.toast.errorBadRequest');
    case 401: return translate.instant('shared.toast.errorUnauthorized');
    case 403: return translate.instant('shared.toast.errorForbidden');
    case 404: return translate.instant('shared.toast.errorNotFound');
    case 409: return translate.instant('shared.toast.errorConflict');
    default: return translate.instant('shared.toast.errorGeneric');
  }
}
