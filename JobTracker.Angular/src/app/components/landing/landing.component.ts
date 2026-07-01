import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher/language-switcher.component';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly auth = inject(AuthService);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly triggers: ScrollTrigger[] = [];
  private floatTween?: gsap.core.Tween;

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.animateHero();
    this.animateSections();
  }

  ngOnDestroy(): void {
    this.triggers.forEach(t => t.kill());
    this.floatTween?.kill();
  }

  private animateHero(): void {
    const root = this.el.nativeElement;

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from(root.querySelector('.landing-nav'), { y: -24, opacity: 0, duration: 0.8 })
      .from(root.querySelector('.hero-title'), { y: 28, opacity: 0, duration: 0.95 }, '-=0.7')
      .from(root.querySelector('.hero-subtitle'), { y: 20, opacity: 0, duration: 0.85 }, '-=0.75')
      .from(root.querySelector('.hero-actions'), { y: 16, opacity: 0, duration: 0.75 }, '-=0.7')
      .from(root.querySelector('.hero-note'), { opacity: 0, duration: 0.75 }, '-=0.65')
      .from(root.querySelector('.hero-stage'), { y: 50, opacity: 0, scale: 0.96, duration: 1.15 }, '-=0.7')
      .from(root.querySelectorAll('.kanban-column'), { y: 24, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.75');

    this.floatTween = gsap.to(root.querySelector('.app-frame'), {
      y: -10, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.5,
      force3D: true
    });
  }

  private animateSections(): void {
    const root = this.el.nativeElement;

    root.querySelectorAll<HTMLElement>('.panel-section').forEach(section => {
      const heading = section.querySelectorAll('.section-title, .section-subtitle');
      if (heading.length) {
        this.scrollFrom(heading, { y: 24, opacity: 0, stagger: 0.06 }, section);
      }

      const cells = section.querySelectorAll('.panel-cell');
      if (cells.length) {
        this.scrollFrom(cells, { y: 30, opacity: 0, stagger: 0.05 }, section.querySelector('.panel-grid') ?? section);
      }

      const statsPanel = section.querySelector<HTMLElement>('.stats-panel');
      if (statsPanel) {
        this.animateStats(statsPanel);
      }
    });

    const cta = root.querySelector('.cta-inner');
    if (cta) {
      this.scrollFrom(cta, { y: 30, opacity: 0, scale: 0.97 }, cta, 'top 85%');
    }
  }

  private animateStats(statsPanel: HTMLElement): void {
    this.scrollFrom(statsPanel.querySelectorAll('.stats-panel-column'), { y: 30, opacity: 0, stagger: 0.09 }, statsPanel);
    this.scrollFrom(statsPanel.querySelectorAll('.stat-legend li'), { x: -16, opacity: 0, stagger: 0.04, delay: 0.1 }, statsPanel);

    const donut = statsPanel.querySelector<HTMLElement>('.stat-donut');
    if (donut) {
      this.scrollFrom(donut, { scale: 0, rotate: -90, opacity: 0, duration: 0.95, ease: 'back.out(1.6)' }, statsPanel);
    }

    const bars = statsPanel.querySelectorAll<HTMLElement>('.weekday-fill');
    if (bars.length) {
      const tween = gsap.from(bars, {
        scaleY: 0,
        transformOrigin: 'bottom',
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.03,
        scrollTrigger: { trigger: statsPanel, start: 'top 75%', once: true }
      });
      if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger);
    }
  }

  private scrollFrom(
    target: Element | Element[] | NodeListOf<Element>,
    vars: gsap.TweenVars,
    trigger: Element,
    start = 'top 80%'
  ): void {
    const tween = gsap.from(target, {
      duration: 0.85,
      ease: 'power3.out',
      ...vars,
      scrollTrigger: { trigger, start, once: true }
    });
    if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger);
  }
}
