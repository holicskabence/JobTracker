import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-control-section',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './control-section.component.html',
  styleUrl: './control-section.component.css'
})
export class ControlSectionComponent implements AfterViewInit, OnDestroy {
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
    const tween = gsap.from(root.querySelectorAll('.feature-item'), {
      y: 18, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 85%', once: true }
    });
    if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger);
  }
}
