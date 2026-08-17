import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher/language-switcher.component';
import { LandingButtonComponent } from './shared/landing-button/landing-button.component';
import { HeroStorySectionComponent } from './sections/hero-story/hero-story-section.component';
import { ControlSectionComponent } from './sections/control/control-section.component';
import { InsightSectionComponent } from './sections/insight/insight-section.component';
import { PreparationSectionComponent } from './sections/preparation/preparation-section.component';
import { ProductSectionComponent } from './sections/product/product-section.component';
import { ActionSectionComponent } from './sections/action/action-section.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    TranslateModule,
    LanguageSwitcherComponent,
    LandingButtonComponent,
    HeroStorySectionComponent,
    ControlSectionComponent,
    InsightSectionComponent,
    PreparationSectionComponent,
    ProductSectionComponent,
    ActionSectionComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  readonly auth = inject(AuthService);
}
