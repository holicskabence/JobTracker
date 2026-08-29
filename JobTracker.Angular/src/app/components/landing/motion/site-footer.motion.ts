import { gsap } from 'gsap';
import { EASE, MotionScope, START, STAGGER, motionGroup, motionSection, settleIn } from './motion-system';

export function initFooterAnimation(scope: MotionScope): void {
    const footer = motionSection(scope.root, 'site-footer');
    if (!footer) return;

    const items = motionGroup(footer, 'footer-brand', 'footer-column', 'footer-social');
    if (!items.length) return;

    const timeline = gsap.timeline({
        scrollTrigger: { trigger: footer, start: START.late, once: true }
    });

    settleIn(timeline, items, 0, {
        y: 8,
        duration: 0.45,
        ease: EASE.micro,
        stagger: STAGGER.tight
    });
}
