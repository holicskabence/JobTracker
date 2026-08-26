import { Component } from '@angular/core';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { HeroComponent } from './hero/hero.component';
import { FeatureStripComponent } from './feature-strip/feature-strip.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { InterviewPrepComponent } from './interview-prep/interview-prep.component';
import { DashboardPreviewComponent } from './dashboard-preview/dashboard-preview.component';
import { CtaBannerComponent } from './cta-banner/cta-banner.component';
import { SiteFooterComponent } from './site-footer/site-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NavBarComponent,
    HeroComponent,
    FeatureStripComponent,
    AnalyticsComponent,
    InterviewPrepComponent,
    DashboardPreviewComponent,
    CtaBannerComponent,
    SiteFooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {}
