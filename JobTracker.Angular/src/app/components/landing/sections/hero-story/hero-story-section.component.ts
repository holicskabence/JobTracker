import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { AuthService } from '../../../../services/auth.service';
import { LandingButtonComponent } from '../../shared/landing-button/landing-button.component';
import { HeroSceneComponent } from './hero-scene/hero-scene.component';
import { HeroFallbackComponent } from './hero-scene/hero-fallback.component';
import { prefersReducedMotion } from './motion-preference';

@Component({
  selector: 'app-hero-story-section',
  standalone: true,
  imports: [TranslateModule, LandingButtonComponent, HeroSceneComponent, HeroFallbackComponent],
  templateUrl: './hero-story-section.component.html',
  styleUrl: './hero-story-section.component.css'
})
export class HeroStorySectionComponent implements AfterViewInit, OnDestroy {
  readonly auth = inject(AuthService);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private timeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    if (prefersReducedMotion()) return;
    this.zone.runOutsideAngular(() => this.animateEntrance());
  }

  ngOnDestroy(): void {
    this.timeline?.kill();
  }

  private animateEntrance(): void {
    const root = this.el.nativeElement;

    this.timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from(root.querySelector('.hero-eyebrow'), { y: 16, opacity: 0, duration: 0.7 })
      .from(root.querySelector('.hero-story-headline'), { y: 24, opacity: 0, duration: 0.9 }, '-=0.55')
      .from(root.querySelector('.hero-story-subheadline'), { y: 20, opacity: 0, duration: 0.85 }, '-=0.65')
      .from(root.querySelector('.hero-story-subtitle'), { y: 16, opacity: 0, duration: 0.8 }, '-=0.6')
      .from(root.querySelector('.hero-story-actions'), { y: 14, opacity: 0, duration: 0.75 }, '-=0.55')
      .from(root.querySelector('.hero-story-trust'), { opacity: 0, duration: 0.7 }, '-=0.5')
      .from(root.querySelector('.hero-story-stage'), { y: 30, opacity: 0, scale: 0.98, duration: 1 }, '-=0.7');
  }
}
