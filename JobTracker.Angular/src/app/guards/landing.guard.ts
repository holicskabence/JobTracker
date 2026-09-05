import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';

export const LANDING_ENABLED = false;

export const landingGuard: CanActivateFn = () => {
  if (LANDING_ENABLED) return true;

  const router = inject(Router);
  if (inject(AuthService).isLoggedIn()) return router.createUrlTree(['/dashboard']);

  return router.createUrlTree([`/${inject(LanguageService).resolveDefaultLang()}/login`]);
};
