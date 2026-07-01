import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DashboardTab } from '../../../models/job.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApplicationsViewService } from '../../../services/applications-view.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  private readonly translate = inject(TranslateService);
  readonly viewService = inject(ApplicationsViewService);

  @Input() activeTab: DashboardTab = 'attekintes';
  @Input() userName = '';
  @Output() addJob = new EventEmitter<void>();
  @Output() openMobileMenu = new EventEmitter<void>();

  get showViewToggle(): boolean {
    return this.activeTab === 'jelentkezesek' && this.viewService.canToggle();
  }

  private readonly PAGE_TITLE_KEYS: Record<DashboardTab, string> = {
    attekintes: 'header.titles.overview',
    jelentkezesek: 'header.titles.applications',
    valtozasok: 'header.titles.applicationChanges',
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
