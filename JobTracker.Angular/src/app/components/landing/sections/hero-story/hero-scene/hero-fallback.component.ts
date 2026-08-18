import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../motion-preference';

interface ChaosCardConfig {
  top: number;
  left: number;
  rotate: number;
  scale: number;
  depth: 'back' | 'mid' | 'front';
}

/**
 * Static SVG/CSS rendition of the chaos -> pipeline story. Used as the @defer
 * placeholder/loading state and as the true no-WebGL fallback, so it must look
 * complete and intentional entirely on its own.
 */
@Component({
  selector: 'app-hero-fallback',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './hero-fallback.component.html',
  styleUrl: './hero-fallback.component.css'
})
export class HeroFallbackComponent implements AfterViewInit, OnDestroy {
  readonly chaosCards: ChaosCardConfig[] = [
    { top: 12, left: 20, rotate: -8, scale: 0.85, depth: 'back' },
    { top: 8, left: 42, rotate: 6, scale: 0.78, depth: 'back' },
    { top: 18, left: 62, rotate: -4, scale: 0.9, depth: 'mid' },
    { top: 30, left: 6, rotate: 10, scale: 0.95, depth: 'mid' },
    { top: 4, left: 76, rotate: -10, scale: 0.8, depth: 'back' },
    { top: 38, left: 30, rotate: 5, scale: 1, depth: 'front' },
    { top: 22, left: 88, rotate: 8, scale: 0.82, depth: 'back' },
    { top: 48, left: 55, rotate: -6, scale: 0.92, depth: 'mid' },
    { top: 55, left: 14, rotate: 12, scale: 0.88, depth: 'mid' },
    { top: 42, left: 80, rotate: -12, scale: 0.86, depth: 'back' },
    { top: 63, left: 40, rotate: 4, scale: 0.95, depth: 'front' },
    { top: 15, left: 3, rotate: -14, scale: 0.8, depth: 'back' }
  ];

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private timeline?: gsap.core.Timeline;
  private readonly idleTweens: gsap.core.Tween[] = [];

  ngAfterViewInit(): void {
    if (prefersReducedMotion()) return;
    this.zone.runOutsideAngular(() => {
      this.animateEntrance();
      this.animateIdle();
    });
  }

  ngOnDestroy(): void {
    this.timeline?.kill();
    this.idleTweens.forEach(tween => tween.kill());
  }

  private animateEntrance(): void {
    const root = this.el.nativeElement;

    this.timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from(root.querySelectorAll('.chaos-card'), { opacity: 0, scale: 0.8, y: 12, duration: 0.7, stagger: 0.045 })
      .from(root.querySelectorAll('.pipeline-path'), { opacity: 0, duration: 0.6 }, '-=0.3')
      .from(root.querySelectorAll('.pipeline-node'), { opacity: 0, scale: 0.4, duration: 0.5, stagger: 0.08, ease: 'back.out(1.8)' }, '-=0.4')
      .from(root.querySelector('.hero-app-card'), { opacity: 0, y: 16, scale: 0.9, duration: 0.7 }, '-=0.3');
  }

  private animateIdle(): void {
    const root = this.el.nativeElement;

    root.querySelectorAll<HTMLElement>('.chaos-card').forEach((card, i) => {
      this.idleTweens.push(
        gsap.to(card, {
          y: '+=6',
          duration: 3 + (i % 4) * 0.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: (i % 5) * 0.3
        })
      );
    });

    root.querySelectorAll<SVGPathElement>('.pipeline-highlight').forEach(path => {
      const length = path.getTotalLength();
      if (!length) return;
      gsap.set(path, { strokeDasharray: `${Math.max(length * 0.06, 6)} ${length}`, strokeDashoffset: 0 });
      this.idleTweens.push(
        gsap.to(path, { strokeDashoffset: -length, duration: 4.5, ease: 'none', repeat: -1 })
      );
    });

    const heroCard = root.querySelector<HTMLElement>('.hero-app-card');
    if (heroCard) {
      this.idleTweens.push(
        gsap.to(heroCard, { y: '-=4', x: '+=3', duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true })
      );
    }

    const activeNodeDot = root.querySelector<HTMLElement>('.pipeline-node--active .pipeline-node-dot');
    if (activeNodeDot) {
      this.idleTweens.push(
        gsap.to(activeNodeDot, {
          boxShadow: '0 0 0 8px rgba(38, 172, 0, 0.14)',
          duration: 1.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true
        })
      );
    }
  }
}
