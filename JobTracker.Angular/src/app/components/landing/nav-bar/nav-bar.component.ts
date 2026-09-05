import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { scrollToFragment } from '../fragment-link';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing-nav-bar',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  readonly auth = inject(AuthService);

  readonly isMobileMenuOpen = signal(false);

  readonly firstName = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return '';
    return user.firstName || user.name || user.email;
  });

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  onSectionLinkClick(event: MouseEvent, fragment: string): void {
    this.isMobileMenuOpen.set(false);
    scrollToFragment(event, fragment);
  }
}
