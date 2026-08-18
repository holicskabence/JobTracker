import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointService } from '../../../../../services/breakpoint.service';
import { isWebglAvailable } from '../webgl-capability';
import { prefersReducedMotion } from '../motion-preference';
import { createPipelineScene, PipelineSceneHandle, StationScreenPosition } from './engine/pipeline-scene';
import { getSceneConfig, QualityTier } from './engine/pipeline-config';
import type { StationKind } from './engine/pipeline-icons';
import { HeroFallbackComponent } from './hero-fallback.component';

@Component({
  selector: 'app-hero-scene',
  standalone: true,
  imports: [TranslateModule, HeroFallbackComponent],
  templateUrl: './hero-scene.component.html',
  styleUrl: './hero-scene.component.css'
})
export class HeroSceneComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('labels') private readonly labelsRef?: ElementRef<HTMLElement>;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly breakpoints = inject(BreakpointService);
  private readonly isTabletOrBelow = this.breakpoints.watch('(max-width: 1024px)');

  readonly webglSupported = signal(isWebglAvailable());
  /** DOM stage labels track the 3D stations via world->screen projection; skipped on
   *  mobile where the stage is small and the labels would crowd the composition. */
  readonly showLabels = !this.breakpoints.isMobile();

  private scene?: PipelineSceneHandle;
  private intersectionObserver?: IntersectionObserver;
  private readonly labelElements = new Map<StationKind, HTMLElement>();
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

  private resolveTier(): QualityTier {
    if (this.breakpoints.isMobile()) return 'mobile';
    if (this.isTabletOrBelow()) return 'tablet';
    return 'desktop';
  }

  private init(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.labelsRef?.nativeElement.querySelectorAll<HTMLElement>('[data-station]').forEach(el => {
      this.labelElements.set(el.dataset['station'] as StationKind, el);
    });

    const config = getSceneConfig(this.resolveTier());
    this.scene = createPipelineScene(canvas, config, {
      reducedMotion: prefersReducedMotion(),
      onStationsProjected: this.labelElements.size ? positions => this.updateLabels(positions) : undefined
    });

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => this.scene?.setPaused(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    this.intersectionObserver.observe(this.host.nativeElement);

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private updateLabels(positions: Record<StationKind, StationScreenPosition>): void {
    this.labelElements.forEach((el, kind) => {
      const pos = positions[kind];
      if (!pos) return;
      el.style.left = pos.leftPct + '%';
      el.style.top = pos.topPct + '%';
      el.style.opacity = pos.visible ? '1' : '0';
    });
  }
}
