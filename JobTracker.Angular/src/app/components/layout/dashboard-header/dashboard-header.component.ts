import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DashboardTab } from '../../../models/job.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  private readonly translate = inject(TranslateService);

  @Input() activeTab: DashboardTab = 'overview';
  @Input() userName = '';
  @Input() sidebarCollapsed = false;
  @Output() addJob = new EventEmitter<void>();
  @Output() openMobileMenu = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly PAGE_TITLE_KEYS: Record<DashboardTab, string> = {
    overview: 'header.titles.overview',
    applications: 'header.titles.applications',
    events: 'header.titles.events',
    documents: 'header.titles.documents',
    statistics: 'header.titles.statistics',
    profile: 'header.titles.profile',
    'master-data': 'header.titles.masterData',
    practice: 'header.titles.practice',
  };

  private readonly ADD_BUTTON_LABEL_KEYS: Partial<Record<DashboardTab, string>> = {
    events: 'events.addEventBtn',
    documents: 'documents.recordFileOrLink',
  };

  get pageTitle(): string {
    const key = this.PAGE_TITLE_KEYS[this.activeTab];
    return key ? this.translate.instant(key) : '';
  }

  get addButtonLabelKey(): string {
    return this.ADD_BUTTON_LABEL_KEYS[this.activeTab] ?? 'header.addJob';
  }
}
