import { gsap } from 'gsap';
import { EASE, MotionScope, motionElement, motionSection } from './motion-system';

export function initParallaxEffects(scope: MotionScope): void {
    if (!scope.isDesktop) return;

    initHeroDepth(scope);
    initAnalyticsBackgroundDrift(scope);
    initDashboardDepth(scope);
}

function initHeroDepth(scope: MotionScope): void {
    const hero = motionSection(scope.root, 'hero');
    if (!hero) return;

    const copy = motionElement(hero, 'hero-copy');
    const mediaFrame = motionElement(hero, 'hero-media-frame');
    if (!copy && !mediaFrame) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.scrub },
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });

    if (copy) {
        gsap.set(copy, { willChange: 'transform' });
        timeline.to(copy, { y: -20 }, 0);
    }

    if (mediaFrame) {
        gsap.set(mediaFrame, { willChange: 'transform' });
        timeline.to(mediaFrame, { y: -8 }, 0);
    }
}

function initAnalyticsBackgroundDrift(scope: MotionScope): void {
    const analytics = motionSection(scope.root, 'analytics');
    if (!analytics) return;

    const background = motionElement(analytics, 'analytics-background');
    if (!background) return;

    gsap.set(background, { willChange: 'transform' });

    gsap.to(background, {
        y: -18,
        x: 10,
        ease: EASE.scrub,
        scrollTrigger: { trigger: analytics, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    });
}

function initDashboardDepth(scope: MotionScope): void {
    const dashboard = motionSection(scope.root, 'dashboard-preview');
    if (!dashboard) return;

    const frame = motionElement(dashboard, 'dashboard-frame');
    if (!frame) return;

    gsap.set(frame, { willChange: 'transform' });

    gsap.fromTo(frame,
        { y: 10 },
        {
            y: -10,
            ease: EASE.scrub,
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
        }
    );
}
