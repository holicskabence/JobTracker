import { gsap } from 'gsap';
import {
    EASE,
    MotionScope,
    START,
    STAGGER,
    countUp,
    dashedVisibleLength,
    drawStroke,
    hintCompositing,
    motionElement,
    motionElements,
    motionGroup,
    motionSection,
    revealHeadlineLines,
    settleIn
} from './motion-system';

export function initAnalyticsAnimation(scope: MotionScope): void {
    const analytics = motionSection(scope.root, 'analytics');
    if (!analytics) return;

    initAnalyticsCopy(scope, analytics);

    const panels = motionElement(analytics, 'analytics-panels');
    if (!panels) return;

    if (scope.isDesktop) {
        initDashboardSequence(scope, panels);
    } else {
        initStackedCardReveals(scope, panels);
    }
}

function initAnalyticsCopy(scope: MotionScope, analytics: HTMLElement): void {
    const copy = motionElement(analytics, 'analytics-copy');
    if (!copy) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: copy, start: START.major, once: true }
    });

    revealHeadlineLines(timeline, motionElement(copy, 'analytics-headline'), scope, 0);

    const paragraph = motionElement(copy, 'analytics-paragraph');
    settleIn(timeline, paragraph ? [paragraph] : [], 0.14, { y: 8 });

    settleIn(timeline, motionElements(copy, 'analytics-check'), 0.24, {
        y: 6,
        duration: 0.45,
        stagger: 0.06
    });

    const cta = motionElement(copy, 'analytics-cta');
    settleIn(timeline, cta ? [cta] : [], 0.42, { y: 8 });
}

function initDashboardSequence(scope: MotionScope, panels: HTMLElement): void {
    const chartCards = motionElements(panels, 'analytics-chart-card');
    const statCards = motionElements(panels, 'analytics-stat-card');
    const funnelCard = motionElement(panels, 'analytics-funnel-card');
    const gaugeCard = motionElement(panels, 'analytics-gauge-card');

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: panels, start: START.analytics, once: true }
    });

    hintCompositing(timeline, [...chartCards, ...statCards], scope);

    settleIn(timeline, chartCards, 0, { y: 12, stagger: 0.08 });
    chartCards.forEach((card, index) => buildChartDrawing(timeline, card, 0.3 + index * 0.09));

    if (funnelCard) {
        settleIn(timeline, [funnelCard], 0.48, { y: 12 });
        buildFunnel(timeline, funnelCard, 0.68);
    }

    settleIn(timeline, statCards, 0.98, { y: 12, stagger: 0.08 });
    statCards.forEach((card, index) => buildStatCount(timeline, card, scope, 1.08 + index * 0.08));

    if (gaugeCard) {
        settleIn(timeline, [gaugeCard], 1.34, { y: 12 });
        buildGauge(timeline, gaugeCard, scope, 1.46);
    }
}

/** Stacked below the desktop breakpoint, so each card is cued by its own position. */
function initStackedCardReveals(scope: MotionScope, panels: HTMLElement): void {
    const cards = motionGroup(
        panels,
        'analytics-chart-card',
        'analytics-funnel-card',
        'analytics-stat-card',
        'analytics-gauge-card'
    );

    for (const card of cards) {
        const timeline = gsap.timeline({
            defaults: { ease: EASE.entrance },
            scrollTrigger: { trigger: card, start: START.normal, once: true }
        });

        settleIn(timeline, [card], 0, { y: 10 });

        buildChartDrawing(timeline, card, 0.18);
        buildFunnel(timeline, card, 0.18);
        buildStatCount(timeline, card, scope, 0.22);
        buildGauge(timeline, card, scope, 0.22);
    }
}

function buildChartDrawing(timeline: gsap.core.Timeline, card: HTMLElement, at: number): void {
    const line = motionElement<SVGPathElement>(card, 'analytics-chart-line');
    if (!line) return;

    drawStroke(timeline, line, at, { duration: 0.9, ease: EASE.micro });

    const area = motionElement<SVGPathElement>(card, 'analytics-chart-area');
    if (area) {
        timeline.from(area, { opacity: 0, duration: 0.5, ease: EASE.micro }, at + 0.6);
    }

    const pointGroup = motionElement<SVGGElement>(card, 'analytics-chart-points');
    const points = pointGroup ? Array.from(pointGroup.children) : [];
    if (points.length) {
        timeline.from(points, {
            opacity: 0,
            duration: 0.3,
            ease: EASE.micro,
            stagger: 0.018
        }, at + 0.25);
    }
}

function buildFunnel(timeline: gsap.core.Timeline, card: HTMLElement, at: number): void {
    const layers = motionElements<SVGPathElement>(card, 'analytics-funnel-layer');
    if (!layers.length) return;

    settleIn(timeline, layers, at, {
        y: -5,
        scale: 0.92,
        duration: 0.45,
        stagger: STAGGER.normal,
        keepTransform: true
    });

    settleIn(timeline, motionElements(card, 'analytics-funnel-row'), at + 0.28, {
        x: 6,
        duration: 0.4,
        ease: EASE.micro,
        stagger: 0.07
    });

    const total = motionElement(card, 'analytics-funnel-total');
    settleIn(timeline, total ? [total] : [], at + 0.56, { duration: 0.4, ease: EASE.micro });
}

function buildStatCount(timeline: gsap.core.Timeline, card: HTMLElement, scope: MotionScope, at: number): void {
    countUp(timeline, motionElement(card, 'analytics-count'), scope, at);
}

function buildGauge(timeline: gsap.core.Timeline, card: HTMLElement, scope: MotionScope, at: number): void {
    const arc = motionElement<SVGPathElement>(card, 'analytics-gauge-arc');
    if (!arc) return;

    drawStroke(timeline, arc, at, {
        duration: DURATION_GAUGE,
        ease: EASE.micro,
        visibleLength: dashedVisibleLength(arc)
    });

    countUp(timeline, motionElement(card, 'analytics-gauge-count'), scope, at + 0.05);

    const caption = motionElement(card, 'analytics-gauge-caption');
    settleIn(timeline, caption ? [caption] : [], at + 0.7, { duration: 0.4, ease: EASE.micro });
}

const DURATION_GAUGE = 1;
