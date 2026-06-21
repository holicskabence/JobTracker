import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { LanguageService } from '../services/language.service';

/** Redirects legacy unprefixed public routes (/, /login, /register) to their /:lang equivalent. */
export const langRedirectGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const languageService = inject(LanguageService);
  const lang = languageService.resolveDefaultLang();
  const suffix = route.routeConfig?.path ? `/${route.routeConfig.path}` : '';
  return router.createUrlTree([`/${lang}${suffix}`]);
};
