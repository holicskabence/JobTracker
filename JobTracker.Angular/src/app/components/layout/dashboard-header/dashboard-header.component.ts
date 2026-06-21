import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DashboardTab } from '../../../models/job.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [TranslateModule, LanguageSwitcherComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  private readonly translate = inject(TranslateService);

  @Input() activeTab: DashboardTab = 'attekintes';
  @Input() userName = '';
  @Output() addJob = new EventEmitter<void>();
  @Output() openMobileMenu = new EventEmitter<void>();

  private readonly PAGE_TITLE_KEYS: Record<DashboardTab, string> = {
    attekintes: 'header.titles.overview',
    jelentkezesek: 'header.titles.applications',
    tablazat: 'header.titles.table',
    esemenyek: 'header.titles.events',
    dokumentumok: 'header.titles.documents',
    statisztika: 'header.titles.statistics',
    profil: 'header.titles.profile',
    torzsadatok: 'header.titles.masterData',
    gyakorlas: 'header.titles.practice',
  };

  get pageTitle(): string {
    const key = this.PAGE_TITLE_KEYS[this.activeTab];
    return key ? this.translate.instant(key) : '';
  }
}
