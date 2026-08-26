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
  selector: 'app-landing-v2',
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
  templateUrl: './landing-v2.component.html',
  styleUrl: './landing-v2.component.css'
})
export class LandingV2Component {}
