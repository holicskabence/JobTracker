import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing-interview-prep',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './interview-prep.component.html',
  styleUrl: './interview-prep.component.css'
})
export class InterviewPrepComponent {
  private readonly auth = inject(AuthService);

  readonly ctaLink = computed(() => this.auth.isLoggedIn() ? '/dashboard/practice' : '/register');
}
