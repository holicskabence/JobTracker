import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LandingButtonComponent } from '../../shared/landing-button/landing-button.component';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-preparation-section',
  standalone: true,
  imports: [TranslateModule, LandingButtonComponent],
  templateUrl: './preparation-section.component.html',
  styleUrl: './preparation-section.component.css'
})
export class PreparationSectionComponent implements AfterViewInit, OnDestroy {
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

    const copyTween = gsap.from(root.querySelectorAll('.preparation-headline, .preparation-copy-text, .preparation-checklist li, .preparation-copy > app-landing-button'), {
      y: 20, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 72%', once: true }
    });
    if (copyTween.scrollTrigger) this.triggers.push(copyTween.scrollTrigger);

    const panelTween = gsap.from(root.querySelector('.interview-panel'), {
      y: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: root.querySelector('.preparation-interface'), start: 'top 75%', once: true }
    });
    if (panelTween.scrollTrigger) this.triggers.push(panelTween.scrollTrigger);

    const evalTween = gsap.from(root.querySelector('.evaluation-card'), {
      y: 20, opacity: 0, scale: 0.94, duration: 0.7, delay: 0.25, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: root.querySelector('.preparation-interface'), start: 'top 65%', once: true }
    });
    if (evalTween.scrollTrigger) this.triggers.push(evalTween.scrollTrigger);

    const objectTween = gsap.from(root.querySelector('.voice-object'), {
      opacity: 0, scale: 0.9, duration: 0.8, delay: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: root.querySelector('.preparation-interface'), start: 'top 70%', once: true }
    });
    if (objectTween.scrollTrigger) this.triggers.push(objectTween.scrollTrigger);
  }
}
