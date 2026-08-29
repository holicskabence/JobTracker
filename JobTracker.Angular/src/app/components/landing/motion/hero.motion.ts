import { gsap } from 'gsap';
import {
    DURATION,
    EASE,
    MotionScope,
    STAGGER,
    hintCompositing,
    motionElement,
    motionElements,
    motionSection,
    revealHeadlineLines,
    settleIn
} from './motion-system';

export function initHeroAnimation(scope: MotionScope): void {
    const hero = motionSection(scope.root, 'hero');
    if (!hero) return;

    const media = motionElement(hero, 'hero-media');
    const scrollHint = motionElement(hero, 'hero-scroll-hint');

    const timeline = gsap.timeline({ paused: true, delay: 0.06, defaults: { ease: EASE.entrance } });
    scope.registerIntro(timeline);
    hintCompositing(timeline, media ? [media] : [], scope);

    revealHeadlineLines(timeline, motionElement(hero, 'hero-headline'), scope, 0);

    const paragraph = motionElement(hero, 'hero-paragraph');
    settleIn(timeline, paragraph ? [paragraph] : [], 0.14, { y: 8 });

    settleIn(timeline, motionElements(hero, 'hero-action'), 0.22, { y: 8 });

    settleIn(timeline, motionElements(hero, 'hero-trust'), 0.3, {
        y: 6,
        duration: 0.45,
        stagger: STAGGER.tight
    });

    if (media) {
        settleIn(timeline, [media], scope.isDesktop ? 0.1 : 0.24, {
            x: scope.isDesktop ? 14 : 0,
            y: scope.isDesktop ? 0 : 10,
            scale: 0.985,
            duration: DURATION.cinematic,
            keepTransform: true
        });
    }

    if (scrollHint) {
        settleIn(timeline, [scrollHint], 0.46, { duration: 0.45 });
        initScrollHint(hero, scrollHint);
    }
}

const HINT_FADE_SCROLL_PX = 140;

function initScrollHint(hero: HTMLElement, scrollHint: HTMLElement): void {
    const arrow = motionElement(hero, 'hero-scroll-arrow');
    if (!arrow) return;

    const bob = gsap.to(arrow, {
        y: 7,
        duration: 0.85,
        ease: EASE.loop,
        yoyo: true,
        repeat: -1
    });
    gsap.to(scrollHint, {
        opacity: 0,
        duration: 0.35,
        ease: EASE.micro,
        scrollTrigger: {
            start: HINT_FADE_SCROLL_PX,
            end: 'max',
            toggleActions: 'play none none reverse'
        },
        onComplete: () => { bob.pause(); },
        onReverseComplete: () => { bob.resume(); }
    });
}
