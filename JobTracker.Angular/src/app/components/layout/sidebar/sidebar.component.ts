import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  readonly showStatistics = !environment.production;

  @Input() activeTab = '';
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Input() userName = '';
  @Input() userEmail = '';
  @Input() avatarUrl: string | null = null;
  @Output() toggleCollapsed = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  get userInitial(): string { return this.userName.charAt(0).toUpperCase() || '?'; }
}
