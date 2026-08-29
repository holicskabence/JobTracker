import { gsap } from 'gsap';
import {
    EASE,
    MotionScope,
    START,
    STAGGER,
    drawStroke,
    hintCompositing,
    motionElement,
    motionElements,
    motionSection,
    revealHeadlineLines,
    settleIn
} from './motion-system';

export function initDashboardAnimation(scope: MotionScope): void {
    const dashboard = motionSection(scope.root, 'dashboard-preview');
    if (!dashboard) return;

    initDashboardCopy(scope, dashboard);
    initProductReveal(scope, dashboard);
}

function initDashboardCopy(scope: MotionScope, dashboard: HTMLElement): void {
    const copy = motionElement(dashboard, 'dashboard-copy');
    if (!copy) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: copy, start: START.normal, once: true }
    });

    revealHeadlineLines(timeline, motionElement(copy, 'dashboard-headline'), scope, 0);

    const paragraph = motionElement(copy, 'dashboard-paragraph');
    settleIn(timeline, paragraph ? [paragraph] : [], 0.14, { y: 8 });

    const cta = motionElement(copy, 'dashboard-cta');
    settleIn(timeline, cta ? [cta] : [], 0.28, { y: 8 });

    drawStroke(timeline, motionElement<SVGPathElement>(copy, 'dashboard-arrow-curve'), 0.42, {
        duration: 0.55,
        ease: EASE.micro
    });
    drawStroke(timeline, motionElement<SVGPathElement>(copy, 'dashboard-arrow-head'), 0.92, {
        duration: 0.2,
        ease: EASE.micro
    });
}

function initProductReveal(scope: MotionScope, dashboard: HTMLElement): void {
    const frame = motionElement(dashboard, 'dashboard-frame');
    const mockup = motionElement(dashboard, 'dashboard-mockup');
    if (!frame || !mockup) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: frame, start: START.dashboard, once: true }
    });

    hintCompositing(timeline, [mockup], scope);

    settleIn(timeline, [mockup], 0, {
        y: scope.isDesktop ? 18 : 0,
        scale: 0.975,
        duration: 0.9,
        ease: EASE.reveal,
        keepTransform: true
    });

    if (scope.isDesktop) initInteriorReveal(timeline, dashboard);
}

function initInteriorReveal(timeline: gsap.core.Timeline, dashboard: HTMLElement): void {
    const sidebar = motionElement(dashboard, 'dashboard-sidebar');
    settleIn(timeline, sidebar ? [sidebar] : [], 0.24, { duration: 0.5, ease: EASE.micro });

    const header = motionElement(dashboard, 'dashboard-header');
    settleIn(timeline, header ? [header] : [], 0.28, { y: 5, duration: 0.45, ease: EASE.micro });

    settleIn(timeline, motionElements(dashboard, 'dashboard-stat-card'), 0.34, {
        y: 6,
        duration: 0.45,
        ease: EASE.micro,
        stagger: STAGGER.tight
    });

    settleIn(timeline, motionElements(dashboard, 'dashboard-panel'), 0.46, {
        y: 6,
        duration: 0.45,
        ease: EASE.micro,
        stagger: 0.07
    });
}
