import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { LandingButtonComponent } from '../../shared/landing-button/landing-button.component';

@Component({
  selector: 'app-action-section',
  standalone: true,
  imports: [TranslateModule, LandingButtonComponent],
  templateUrl: './action-section.component.html',
  styleUrl: './action-section.component.css'
})
export class ActionSectionComponent {
  readonly auth = inject(AuthService);
}
