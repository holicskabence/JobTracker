import { gsap } from 'gsap';
import { EASE, MotionScope, STAGGER, motionElement, motionElements, motionSection, settleIn } from './motion-system';

export function initNavBarAnimation(scope: MotionScope): void {
    const navBar = motionSection(scope.root, 'nav-bar');
    if (!navBar) return;

    const brand = motionElement(navBar, 'nav-brand');
    const timeline = gsap.timeline({ paused: true, defaults: { ease: EASE.entrance } });
    scope.registerIntro(timeline);

    settleIn(timeline, brand ? [brand] : [], 0, { y: -6, duration: 0.4 });
    settleIn(timeline, motionElements(navBar, 'nav-link'), 0.06, { y: -5, duration: 0.4, stagger: STAGGER.tight });
    settleIn(timeline, motionElements(navBar, 'nav-action'), 0.12, { y: -5, duration: 0.4, stagger: STAGGER.tight });
}
