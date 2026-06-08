import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { gsap } from 'gsap';

@Directive({ selector: '[appPageEnter]', standalone: true })
export class PageEnterDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLElement>) { }

  ngAfterViewInit(): void {
    gsap.fromTo(
      this.el.nativeElement,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out', clearProps: 'transform' }
    );
  }
}
