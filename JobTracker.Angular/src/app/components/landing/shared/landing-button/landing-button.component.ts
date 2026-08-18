import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-button',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './landing-button.component.html',
  styleUrl: './landing-button.component.css'
})
export class LandingButtonComponent {
  /** Angular route to navigate to. Omit and use `href` instead for same-page anchors. */
  @Input() routerLink?: string;
  /** Plain anchor href, e.g. a same-page `#section` scroll target. Ignored if `routerLink` is set. */
  @Input() href?: string;
  @Input() variant: 'primary' | 'ghost' | 'cta' | 'outline' = 'primary';
  @Input() size: 'default' | 'lg' = 'default';

  /**
   * index.html sets <base href="/">, which makes a plain `href="#section"` resolve against "/"
   * instead of the current (language-prefixed) path -- turning what should be a same-page scroll
   * into a full navigation. Intercept in-page anchors and scroll manually instead.
   */
  onAnchorClick(event: MouseEvent): void {
    if (!this.href?.startsWith('#')) return;
    const target = document.querySelector(this.href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
