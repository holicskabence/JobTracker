import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { BreakpointService } from '../../../../../services/breakpoint.service';
import { isWebglAvailable } from '../webgl-capability';
import { prefersReducedMotion } from '../motion-preference';
import { createPlaceholderScene, PlaceholderSceneHandle } from './engine/placeholder-scene';
import { HeroFallbackComponent } from './hero-fallback.component';

@Component({
  selector: 'app-hero-scene',
  standalone: true,
  imports: [HeroFallbackComponent],
  templateUrl: './hero-scene.component.html',
  styleUrl: './hero-scene.component.css'
})
export class HeroSceneComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly breakpoints = inject(BreakpointService);

  readonly webglSupported = signal(isWebglAvailable());

  private scene?: PlaceholderSceneHandle;
  private intersectionObserver?: IntersectionObserver;
  private readonly onVisibilityChange = () => this.scene?.setPaused(document.hidden);

  ngAfterViewInit(): void {
    if (!this.webglSupported()) return;
    this.zone.runOutsideAngular(() => this.init());
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.scene?.dispose();
  }

  private init(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.scene = createPlaceholderScene(canvas, {
      reducedMotion: prefersReducedMotion(),
      qualityTier: this.breakpoints.isMobile() ? 'mobile' : 'desktop'
    });

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => this.scene?.setPaused(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    this.intersectionObserver.observe(this.host.nativeElement);

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }
}
