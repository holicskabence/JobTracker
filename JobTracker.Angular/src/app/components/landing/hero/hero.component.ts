import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HeroIllustrationComponent } from './hero-illustration.component';
import { scrollToFragment } from '../fragment-link';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink, TranslateModule, HeroIllustrationComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  private readonly auth = inject(AuthService);

  readonly primaryAction = computed(() => this.auth.isLoggedIn()
    ? { link: '/dashboard', labelKey: 'landing.hero.ctaPrimaryLoggedIn' }
    : { link: '/register', labelKey: 'landing.hero.ctaPrimary' });

  onSectionLinkClick(event: MouseEvent, fragment: string): void {
    scrollToFragment(event, fragment);
  }
}
