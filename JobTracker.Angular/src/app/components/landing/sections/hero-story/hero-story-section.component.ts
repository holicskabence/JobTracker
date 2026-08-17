import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { LandingButtonComponent } from '../../shared/landing-button/landing-button.component';
import { HeroSceneComponent } from './hero-scene/hero-scene.component';
import { HeroFallbackComponent } from './hero-scene/hero-fallback.component';

@Component({
  selector: 'app-hero-story-section',
  standalone: true,
  imports: [TranslateModule, LandingButtonComponent, HeroSceneComponent, HeroFallbackComponent],
  templateUrl: './hero-story-section.component.html',
  styleUrl: './hero-story-section.component.css'
})
export class HeroStorySectionComponent {
  readonly auth = inject(AuthService);
}
