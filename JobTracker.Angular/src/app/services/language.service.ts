import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';
import { AppLang, SUPPORTED_LANGS } from '../utils/lang-route-matcher';

const STORAGE_KEY = 'jt_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly currentLang = signal<AppLang>('en');

  constructor() {
    // Re-apply the account's saved language on every login (demo/email/social),
    // since APP_INITIALIZER only runs once at cold boot, not on in-session logins.
    effect(() => {
      const user = this.auth.currentUser();
      if (user && this.isSupported(user.preferredLanguage)) {
        this.apply(user.preferredLanguage);
      }
    }, { allowSignalWrites: true });
  }

  resolveDefaultLang(): AppLang {
    const stored = localStorage.getItem(STORAGE_KEY);
    return this.isSupported(stored) ? stored : 'en';
  }

  /** Called by langGuard when entering a /:lang prefixed public route. */
  activatePublicLang(lang: AppLang): void {
    this.apply(lang);
  }

  /** Called once at app bootstrap. */
  initFromUser(lang: string | null | undefined): void {
    this.apply(this.isSupported(lang) ? lang : this.resolveDefaultLang());
  }

  /** Called by the language switcher UI. */
  setLanguage(lang: AppLang): void {
    this.apply(lang);

    if (this.auth.isLoggedIn()) {
      const user = this.auth.currentUser();
      if (user) {
        this.auth.updateProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          position: user.position,
          email: user.email,
          phone: user.phone,
          goal: user.goal,
          useAiEvaluation: user.useAiEvaluation,
          preferredLanguage: lang
        }).subscribe();
      }
      return;
    }

    const match = this.router.url.match(/^\/(en|hu)(\/.*)?$/);
    if (match) {
      const rest = match[2] ?? '';
      this.router.navigateByUrl(`/${lang}${rest}`);
    }
  }

  private apply(lang: AppLang): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  private isSupported(lang: string | null | undefined): lang is AppLang {
    return !!lang && SUPPORTED_LANGS.includes(lang as AppLang);
  }
}
