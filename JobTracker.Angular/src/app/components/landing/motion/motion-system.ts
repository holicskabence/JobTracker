import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

export const DURATION = {
    micro: 0.3,
    entrance: 0.5,
    cinematic: 0.8,
    count: 0.9,
    draw: 1.05
} as const;

export const EASE = {
    micro: 'power2.out',
    entrance: 'power3.out',
    reveal: 'expo.out',
    scrub: 'none',
    loop: 'sine.inOut'
} as const;

export const STAGGER = {
    tight: 0.05,
    normal: 0.08,
    loose: 0.12
} as const;

export const START = {
    late: 'top 82%',
    normal: 'top 78%',
    major: 'top 72%',
    dashboard: 'top 75%',
    analytics: 'top 65%'
} as const;

export interface MotionScope {
    readonly root: HTMLElement;
    readonly isDesktop: boolean;
    onTeardown(cleanup: () => void): void;
    registerIntro(timeline: gsap.core.Timeline): void;
}

export function motionSection(root: ParentNode, name: string): HTMLElement | null {
    return root.querySelector<HTMLElement>('[data-section="' + name + '"]');
}

export function motionElement<T extends Element = HTMLElement>(root: ParentNode, name: string): T | null {
    return root.querySelector<T>('[data-animate="' + name + '"]');
}

export function motionElements<T extends Element = HTMLElement>(root: ParentNode, name: string): T[] {
    return Array.from(root.querySelectorAll<T>('[data-animate="' + name + '"]'));
}

export function motionGroup<T extends Element = HTMLElement>(root: ParentNode, ...names: string[]): T[] {
    const selector = names.map(name => '[data-animate="' + name + '"]').join(',');
    return Array.from(root.querySelectorAll<T>(selector));
}

export interface SettleOptions {
    y?: number;
    x?: number;
    scale?: number;
    rotate?: number;
    duration?: number;
    stagger?: number;
    ease?: string;
    transformOrigin?: string;
    keepTransform?: boolean;
}

/** Fade and movement in one tween, so an element is never visible before it has arrived. */
export function settleIn(
    timeline: gsap.core.Timeline,
    targets: Element | Element[],
    position: gsap.Position,
    options: SettleOptions = {}
): void {
    const list = Array.isArray(targets) ? targets : [targets];
    if (!list.length) return;

    const vars: gsap.TweenVars = {
        opacity: 0,
        y: options.y ?? 0,
        x: options.x ?? 0,
        scale: options.scale ?? 1,
        rotate: options.rotate ?? 0,
        transformOrigin: options.transformOrigin ?? '50% 50%',
        duration: options.duration ?? DURATION.entrance,
        ease: options.ease ?? EASE.entrance,
        stagger: options.stagger ?? 0
    };

    if (!options.keepTransform) vars['clearProps'] = 'transform';

    timeline.from(list, vars, position);
}

const MASK_DESCENDER_ROOM = '0.28em';

export function revealHeadlineLines(
    timeline: gsap.core.Timeline,
    headline: HTMLElement | null,
    scope: MotionScope,
    position: gsap.Position = 0
): void {
    if (!headline) return;

    const originalHeight = headline.getBoundingClientRect().height;

    const split = new SplitText(headline, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'landing-motion-headline-line'
    });

    // flow-root stops the last mask's negative margin collapsing out of the heading,
    // which would otherwise leave it taller while split than when reverted.
    gsap.set(headline, { display: 'flow-root' });
    gsap.set(split.masks, { paddingBottom: MASK_DESCENDER_ROOM, marginBottom: '-' + MASK_DESCENDER_ROOM });

    const drift = headline.getBoundingClientRect().height - originalHeight;
    const lastMask = split.masks[split.masks.length - 1];
    if (lastMask && Math.abs(drift) > 0.5) {
        const paid = Number.parseFloat(getComputedStyle(lastMask).marginBottom) || 0;
        gsap.set(lastMask, { marginBottom: (paid - drift) + 'px' });
    }

    let restored = false;
    const restore = () => {
        if (restored) return;
        restored = true;
        split.revert();
        gsap.set(headline, { clearProps: 'display' });
    };
    scope.onTeardown(restore);

    timeline.from(split.lines, {
        y: (_index: number, target: HTMLElement) => (target.parentElement ?? target).offsetHeight + 2,
        duration: DURATION.cinematic,
        ease: EASE.reveal,
        stagger: STAGGER.normal,
        onComplete: restore
    }, position);
}

export function countUp(
    timeline: gsap.core.Timeline,
    element: HTMLElement | null,
    scope: MotionScope,
    position: gsap.Position,
    duration: number = DURATION.count
): void {
    if (!element) return;

    const original = element.textContent ?? '';
    const target = Number.parseFloat(original);
    if (!Number.isFinite(target)) return;

    timeline.call(() => { element.textContent = '0'; }, undefined, 0);
    scope.onTeardown(() => { element.textContent = original; });

    const counter = { value: 0 };

    timeline.to(counter, {
        value: target,
        duration,
        ease: EASE.micro,
        onUpdate: () => { element.textContent = Math.round(counter.value).toString(); },
        onComplete: () => { element.textContent = original; }
    }, position);
}

export function drawStroke(
    timeline: gsap.core.Timeline,
    path: SVGGeometryElement | null,
    position: gsap.Position,
    options: { duration?: number; ease?: string; visibleLength?: number } = {}
): void {
    if (!path) return;

    const length = path.getTotalLength();
    if (!length) return;

    const visible = options.visibleLength ?? length;

    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    timeline.to(path, {
        strokeDashoffset: length - visible,
        duration: options.duration ?? DURATION.draw,
        ease: options.ease ?? EASE.micro,
        clearProps: 'strokeDasharray,strokeDashoffset'
    }, position);
}

export function dashedVisibleLength(path: SVGGeometryElement | null): number | undefined {
    const attribute = path?.getAttribute('stroke-dasharray');
    if (!attribute) return undefined;

    const first = Number.parseFloat(attribute.split(/[\s,]+/)[0] ?? '');
    return Number.isFinite(first) ? first : undefined;
}

export function hintCompositing(timeline: gsap.core.Timeline, targets: Element[], scope: MotionScope): void {
    if (!targets.length) return;

    const clear = () => { gsap.set(targets, { willChange: 'auto' }); };
    scope.onTeardown(clear);

    timeline.eventCallback('onStart', () => { gsap.set(targets, { willChange: 'transform, opacity' }); });
    timeline.eventCallback('onComplete', clear);
}
