import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LandingButtonComponent } from '../../shared/landing-button/landing-button.component';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-insight-section',
  standalone: true,
  imports: [TranslateModule, LandingButtonComponent],
  templateUrl: './insight-section.component.html',
  styleUrl: './insight-section.component.css'
})
export class InsightSectionComponent implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly triggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.animate());
  }

  ngOnDestroy(): void {
    this.triggers.forEach(t => t.kill());
  }

  private animate(): void {
    const root = this.el.nativeElement;

    const copyTween = gsap.from(root.querySelectorAll('.insight-headline, .insight-copy-text, .insight-checklist li, .insight-copy > app-landing-button'), {
      y: 20, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 72%', once: true }
    });
    if (copyTween.scrollTrigger) this.triggers.push(copyTween.scrollTrigger);

    const cardsTween = gsap.from(root.querySelectorAll('.insight-card'), {
      y: 24, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: root.querySelector('.insight-visuals'), start: 'top 78%', once: true }
    });
    if (cardsTween.scrollTrigger) this.triggers.push(cardsTween.scrollTrigger);

    const bars = root.querySelectorAll<HTMLElement>('.funnel-bar-fill');
    if (bars.length) {
      const barTween = gsap.from(bars, {
        scaleX: 0, transformOrigin: 'left center', duration: 0.8, stagger: 0.05, ease: 'power3.out',
        scrollTrigger: { trigger: root.querySelector('.insight-card--funnel'), start: 'top 75%', once: true }
      });
      if (barTween.scrollTrigger) this.triggers.push(barTween.scrollTrigger);
    }

    const gaugeFill = root.querySelector<SVGPathElement>('.gauge-fill');
    if (gaugeFill) {
      const length = gaugeFill.getTotalLength();
      gsap.set(gaugeFill, { strokeDasharray: length, strokeDashoffset: length });
      const gaugeTween = gsap.to(gaugeFill, {
        strokeDashoffset: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: root.querySelector('.insight-card--gauge'), start: 'top 75%', once: true }
      });
      if (gaugeTween.scrollTrigger) this.triggers.push(gaugeTween.scrollTrigger);
    }
  }
}
