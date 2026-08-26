import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { scrollToFragment } from '../fragment-link';

@Component({
  selector: 'app-landing-nav-bar',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  onSectionLinkClick(event: MouseEvent, fragment: string): void {
    this.isMobileMenuOpen.set(false);
    scrollToFragment(event, fragment);
  }
}
