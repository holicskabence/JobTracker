import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { HeroComponent } from './hero/hero.component';
import { FeatureStripComponent } from './feature-strip/feature-strip.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { InterviewPrepComponent } from './interview-prep/interview-prep.component';
import { DashboardPreviewComponent } from './dashboard-preview/dashboard-preview.component';
import { CtaBannerComponent } from './cta-banner/cta-banner.component';
import { SiteFooterComponent } from './site-footer/site-footer.component';
import { LandingMotion, createLandingMotion } from './motion/landing-motion';

const MOTION_PENDING_CLASS = 'landing-motion-pending';

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
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);

  private motion?: LandingMotion;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.motion = createLandingMotion(this.host.nativeElement, () => this.reveal());
    });
  }

  ngOnDestroy(): void {
    this.motion?.destroy();
    this.motion = undefined;
  }

  private reveal(): void {
    this.host.nativeElement
      .querySelector('.' + MOTION_PENDING_CLASS)
      ?.classList.remove(MOTION_PENDING_CLASS);
  }
}
