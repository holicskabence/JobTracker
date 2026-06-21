import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { LanguageService } from '../services/language.service';
import { AppLang } from '../utils/lang-route-matcher';

export const langGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const languageService = inject(LanguageService);
  const lang = route.paramMap.get('lang') as AppLang;
  languageService.activatePublicLang(lang);
  return true;
};
