import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-product-section',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './product-section.component.html',
  styleUrl: './product-section.component.css'
})
export class ProductSectionComponent implements AfterViewInit, OnDestroy {
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

    const copyTween = gsap.from(root.querySelectorAll('.product-eyebrow, .product-headline, .product-copy-text'), {
      y: 22, opacity: 0, duration: 0.75, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 72%', once: true }
    });
    if (copyTween.scrollTrigger) this.triggers.push(copyTween.scrollTrigger);

    const frameTween = gsap.from(root.querySelector('.product-frame'), {
      y: 50, opacity: 0, rotateY: -18, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: root.querySelector('.product-stage'), start: 'top 78%', once: true }
    });
    if (frameTween.scrollTrigger) this.triggers.push(frameTween.scrollTrigger);
  }
}
