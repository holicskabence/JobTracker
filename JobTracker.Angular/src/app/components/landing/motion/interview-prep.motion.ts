import { gsap } from 'gsap';
import {
    DURATION,
    EASE,
    MotionScope,
    START,
    STAGGER,
    countUp,
    hintCompositing,
    motionElement,
    motionElements,
    motionGroup,
    motionSection,
    revealHeadlineLines,
    settleIn
} from './motion-system';

export function initInterviewAnimation(scope: MotionScope): void {
    const interview = motionSection(scope.root, 'interview-prep');
    if (!interview) return;

    initInterviewCopy(scope, interview);
    initInterviewPanel(scope, interview);
    initRobotMedia(scope, interview);
}

function initInterviewCopy(scope: MotionScope, interview: HTMLElement): void {
    const copy = motionElement(interview, 'interview-copy');
    if (!copy) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: copy, start: START.major, once: true }
    });

    revealHeadlineLines(timeline, motionElement(copy, 'interview-headline'), scope, 0);

    const paragraph = motionElement(copy, 'interview-paragraph');
    settleIn(timeline, paragraph ? [paragraph] : [], 0.14, { y: 8 });

    settleIn(timeline, motionElements(copy, 'interview-check'), 0.24, {
        y: 6,
        duration: 0.45,
        stagger: 0.06
    });

    const cta = motionElement(copy, 'interview-cta');
    settleIn(timeline, cta ? [cta] : [], 0.42, { y: 8 });
}

function initInterviewPanel(scope: MotionScope, interview: HTMLElement): void {
    const panel = motionElement(interview, 'interview-panel');
    if (!panel) return;

    const timeline = gsap.timeline({
        defaults: { ease: EASE.entrance },
        scrollTrigger: { trigger: panel, start: START.normal, once: true }
    });

    hintCompositing(timeline, [panel], scope);

    settleIn(timeline, [panel], 0, {
        y: 16,
        scale: 0.985,
        duration: DURATION.cinematic
    });

    settleIn(timeline, motionGroup(panel, 'interview-question-label', 'interview-question'), 0.2, {
        y: 6,
        duration: 0.45,
        ease: EASE.micro,
        stagger: STAGGER.tight
    });

    const answer = motionElement(panel, 'interview-answer');
    if (answer) {
        settleIn(timeline, [answer], 0.34, { y: 6, duration: 0.45, ease: EASE.micro });
        timeline.from(answer, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            duration: 0.6,
            ease: EASE.micro,
            clearProps: 'backgroundColor'
        }, 0.38);
    }

    const evaluationLabel = motionElement(panel, 'interview-evaluation-label');
    settleIn(timeline, evaluationLabel ? [evaluationLabel] : [], 0.56, { duration: 0.35, ease: EASE.micro });

    const verdict = motionElement(panel, 'interview-verdict');
    settleIn(timeline, verdict ? [verdict] : [], 0.64, { y: 5, duration: 0.4, ease: EASE.micro });

    settleIn(timeline, motionElements(panel, 'interview-feedback'), 0.72, {
        x: 6,
        duration: 0.4,
        ease: EASE.micro,
        stagger: 0.09
    });

    countUp(timeline, motionElement(panel, 'interview-score'), scope, 0.8, 0.7);
}

function initRobotMedia(scope: MotionScope, interview: HTMLElement): void {
    const robot = motionElement(interview, 'interview-robot');
    if (!robot) return;

    const panel = motionElement(interview, 'interview-panel');

    const timeline = gsap.timeline({
        scrollTrigger: {
            trigger: scope.isDesktop && panel ? panel : robot,
            start: scope.isDesktop ? 'top 68%' : START.normal,
            once: true
        }
    });

    hintCompositing(timeline, [robot], scope);

    settleIn(timeline, [robot], scope.isDesktop ? 0.3 : 0, {
        x: scope.isDesktop ? 14 : 0,
        y: scope.isDesktop ? 0 : 10,
        scale: 0.985,
        duration: DURATION.cinematic,
        keepTransform: true
    });
}
