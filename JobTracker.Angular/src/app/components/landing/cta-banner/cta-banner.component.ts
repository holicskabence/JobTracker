import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

const GUEST_COPY = {
  headlineKey: 'landing.cta.headline',
  paragraphKey: 'landing.cta.paragraph',
  primaryLabelKey: 'landing.cta.ctaPrimary',
  primaryLink: '/register',
  secondaryLabelKey: 'landing.cta.ctaSecondary',
  secondaryLink: '/login'
};

const MEMBER_COPY = {
  headlineKey: 'landing.cta.headlineLoggedIn',
  paragraphKey: 'landing.cta.paragraphLoggedIn',
  primaryLabelKey: 'landing.cta.ctaPrimaryLoggedIn',
  primaryLink: '/dashboard',
  secondaryLabelKey: 'landing.cta.ctaSecondaryLoggedIn',
  secondaryLink: '/dashboard/applications'
};

@Component({
  selector: 'app-landing-cta-banner',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './cta-banner.component.html',
  styleUrl: './cta-banner.component.css'
})
export class CtaBannerComponent {
  private readonly auth = inject(AuthService);

  readonly copy = computed(() => this.auth.isLoggedIn() ? MEMBER_COPY : GUEST_COPY);
}
