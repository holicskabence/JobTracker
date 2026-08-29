import { gsap } from 'gsap';
import {
    DURATION,
    EASE,
    MotionScope,
    START,
    hintCompositing,
    motionElement,
    motionElements,
    motionSection,
    settleIn
} from './motion-system';

export function initCtaAnimation(scope: MotionScope): void {
    const cta = motionSection(scope.root, 'cta-banner');
    if (!cta) return;

    const banner = motionElement(cta, 'cta-banner');
    if (!banner) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: banner, start: START.normal, once: true }
    });

    hintCompositing(timeline, [banner], scope);

    settleIn(timeline, [banner], 0, {
        y: 12,
        scale: 0.99,
        duration: DURATION.cinematic
    });

    const rocket = motionElement(cta, 'cta-rocket');
    settleIn(timeline, rocket ? [rocket] : [], 0.1, {
        x: scope.isDesktop ? -10 : 0,
        y: scope.isDesktop ? 0 : 8,
        rotate: scope.isDesktop ? -4 : 0,
        transformOrigin: '50% 70%',
        duration: DURATION.cinematic
    });

    settleIn(timeline, motionElements(cta, 'cta-text'), 0.18, {
        y: 6,
        duration: 0.45,
        ease: EASE.micro,
        stagger: 0.07
    });

    settleIn(timeline, motionElements(cta, 'cta-button'), 0.3, {
        y: 6,
        duration: 0.45,
        ease: EASE.micro,
        stagger: 0.07
    });
}
