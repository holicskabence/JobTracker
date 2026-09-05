import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing-analytics',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  private readonly auth = inject(AuthService);

  readonly ctaLink = computed(() => this.auth.isLoggedIn() ? '/dashboard/statistics' : '/register');
}
