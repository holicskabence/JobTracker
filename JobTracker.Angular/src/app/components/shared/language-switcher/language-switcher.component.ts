import { Component, Input, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { AppLang, SUPPORTED_LANGS } from '../../../utils/lang-route-matcher';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);

  @Input() variant: 'light' | 'dark' = 'light';

  readonly langs = SUPPORTED_LANGS;
  readonly currentLang = this.languageService.currentLang;

  select(lang: AppLang): void {
    if (lang === this.currentLang()) return;
    this.languageService.setLanguage(lang);
  }
}
