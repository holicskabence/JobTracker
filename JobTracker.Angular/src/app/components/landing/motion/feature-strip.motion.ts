import { gsap } from 'gsap';
import {
    EASE,
    MotionScope,
    START,
    motionElements,
    motionGroup,
    motionSection,
    settleIn
} from './motion-system';

export function initFeatureAnimation(scope: MotionScope): void {
    const featureStrip = motionSection(scope.root, 'feature-strip');
    if (!featureStrip) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: featureStrip, start: START.normal, once: true }
    });

    settleIn(timeline, motionElements(featureStrip, 'feature-icon'), 0, {
        y: 8,
        scale: 0.9,
        rotate: -3,
        duration: 0.45,
        stagger: 0.055
    });

    // Title and description alternate in document order, so half the step per element
    // starts a new column roughly every 0.09s.
    settleIn(timeline, motionGroup(featureStrip, 'feature-title', 'feature-description'), 0.16, {
        y: 10,
        stagger: 0.045
    });
}
