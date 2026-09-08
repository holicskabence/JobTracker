import { Component, Input, Output, EventEmitter, afterNextRender, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() activeTab = '';
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Input() userName = '';
  @Input() userEmail = '';
  @Input() avatarUrl: string | null = null;
  @Output() closeMobile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  readonly animated = signal(false);

  constructor() {
    afterNextRender(() => this.animated.set(true));
  }

  get userInitial(): string { return this.userName.charAt(0).toUpperCase() || '?'; }
}
