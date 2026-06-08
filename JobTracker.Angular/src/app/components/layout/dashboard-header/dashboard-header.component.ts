import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DashboardTab } from '../../../models/job.model';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  @Input() activeTab: DashboardTab = 'attekintes';
  @Input() userName = '';
  @Output() addJob = new EventEmitter<void>();
  @Output() openMobileMenu = new EventEmitter<void>();

  private readonly PAGE_TITLES: Record<DashboardTab, string> = {
    attekintes: 'Áttekintés',
    jelentkezesek: 'Jelentkezések',
    tablazat: 'Táblázat',
    esemenyek: 'Események & Teendők',
    dokumentumok: 'Dokumentumok & Sablonok',
    statisztika: 'Statisztika',
    profil: 'Profil beállítások',
    torzsadatok: 'Törzsadat-karbantartás',
    gyakorlas: 'Interjú Felkészülés',
  };

  get pageTitle(): string {
    return this.PAGE_TITLES[this.activeTab] ?? '';
  }
}
