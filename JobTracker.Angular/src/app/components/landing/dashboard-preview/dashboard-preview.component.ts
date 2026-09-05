import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CtaBannerComponent } from "../cta-banner/cta-banner.component";
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing-dashboard-preview',
  standalone: true,
  imports: [RouterLink, TranslateModule, CtaBannerComponent],
  templateUrl: './dashboard-preview.component.html',
  styleUrl: './dashboard-preview.component.css'
})
export class DashboardPreviewComponent {
  private readonly auth = inject(AuthService);

  readonly ctaLink = computed(() => this.auth.isLoggedIn() ? '/dashboard' : '/register');
}
