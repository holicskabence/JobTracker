import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { MotionScope, motionSection } from './motion-system';
import { initNavBarAnimation } from './nav-bar.motion';
import { initHeroAnimation } from './hero.motion';
import { initFeatureAnimation } from './feature-strip.motion';
import { initAnalyticsAnimation } from './analytics.motion';
import { initInterviewAnimation } from './interview-prep.motion';
import { initDashboardAnimation } from './dashboard-preview.motion';
import { initCtaAnimation } from './cta-banner.motion';
import { initFooterAnimation } from './site-footer.motion';
import { initParallaxEffects } from './parallax.motion';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const DESKTOP_QUERY = '(min-width: 941px)';
const READY_TIMEOUT_MS = 900;
const DEFERRED_BUILD_GRACE_MS = 120;

const BELOW_THE_FOLD: ReadonlyArray<readonly [string, (scope: MotionScope) => void]> = [
    ['analytics', initAnalyticsAnimation],
    ['interview-prep', initInterviewAnimation],
    ['dashboard-preview', initDashboardAnimation],
    ['cta-banner', initCtaAnimation],
    ['site-footer', initFooterAnimation]
];

function isOnScreen(root: HTMLElement, sectionName: string): boolean {
    const section = motionSection(root, sectionName);
    return !!section && section.getBoundingClientRect().top < window.innerHeight;
}

export interface LandingMotion {
    destroy(): void;
}

export function createLandingMotion(root: HTMLElement, onBuilt: () => void): LandingMotion {
    let destroyed = false;
    let built = false;

    const mediaQueries = gsap.matchMedia(root);
    const context = gsap.context(() => { /* filled in by build */ }, root);

    const build = () => {
        if (destroyed || built) return;
        built = true;
        try {
            buildTimelines(root, mediaQueries, context, onBuilt);
        } catch (error) {
            onBuilt();
            throw error;
        }
    };

    whenContentIsSettled(root).then(build);

    document.fonts?.ready.then(() => {
        if (!destroyed && built) ScrollTrigger.refresh();
    });

    return {
        destroy(): void {
            destroyed = true;
            mediaQueries.revert();
            context.revert();
        }
    };
}

/**
 * The translated copy and Poppins both land after Angular's first paint and both
 * change the layout. Animating before them plays the entrance against a layout
 * that is about to move. The deadline keeps a slow font from blocking the page.
 */
function whenContentIsSettled(root: HTMLElement): Promise<void> {
    const deadline = performance.now() + READY_TIMEOUT_MS;

    let fontsReady = !document.fonts;
    document.fonts?.ready.then(() => { fontsReady = true; });

    const copyHasLanded = () => {
        const headline = root.querySelector('[data-animate="hero-headline"]');
        return !headline || (headline.textContent ?? '').trim().length > 0;
    };

    return new Promise(resolve => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            resolve();
        };

        const check = () => {
            if (settled) return;
            if ((fontsReady && copyHasLanded()) || performance.now() >= deadline) finish();
            else requestAnimationFrame(check);
        };

        requestAnimationFrame(check);
        setTimeout(finish, READY_TIMEOUT_MS);
    });
}

function buildTimelines(
    root: HTMLElement,
    mediaQueries: gsap.MatchMedia,
    context: gsap.Context,
    onBuilt: () => void
): void {
    context.add(() => {
        mediaQueries.add(
            {
                isDesktop: DESKTOP_QUERY,
                prefersReducedMotion: '(prefers-reduced-motion: reduce)'
            },
            mediaContext => {
                const conditions = mediaContext.conditions ?? {};
                if (conditions['prefersReducedMotion']) {
                    onBuilt();
                    return undefined;
                }

                const teardowns: (() => void)[] = [];
                const intros: gsap.core.Timeline[] = [];

                const scope: MotionScope = {
                    root,
                    isDesktop: conditions['isDesktop'] === true,
                    onTeardown: cleanup => { teardowns.push(cleanup); },
                    registerIntro: timeline => { intros.push(timeline); }
                };

                initNavBarAnimation(scope);
                initHeroAnimation(scope);
                initFeatureAnimation(scope);

                // A section still on screen must be hidden before the page is
                // uncovered, or it shows at full opacity and then snaps out.
                const onScreen = BELOW_THE_FOLD.filter(([name]) => isOnScreen(root, name));
                const offScreen = BELOW_THE_FOLD.filter(([name]) => !isOnScreen(root, name));

                for (const [, init] of onScreen) init(scope);

                onBuilt();

                const rest = [
                    ...offScreen.map(([, init]) => () => init(scope)),
                    () => initParallaxEffects(scope)
                ].map(task => () => mediaContext.add(task));

                let stopDeferred = () => { /* replaced once the intro starts */ };

                const startIntro = afterNextPaint(() => {
                    for (const intro of intros) intro.play();
                    stopDeferred = deferBuild(rest, introDuration(intros));
                });

                return () => {
                    startIntro();
                    stopDeferred();
                    for (const cleanup of teardowns.reverse()) cleanup();
                };
            }
        );
    });
}

/**
 * Uncovering the page costs a style and paint pass. A timeline started in that
 * same frame loses its first frames to it, which is what makes smooth motion
 * look like a stutter. The timeout inside the frame callback runs after the
 * browser has painted, so the intro always begins on a settled thread.
 */
function afterNextPaint(run: () => void): () => void {
    let timer = 0;
    const frame = requestAnimationFrame(() => { timer = window.setTimeout(run, 0); });
    return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
    };
}

function introDuration(intros: gsap.core.Timeline[]): number {
    let longest = 0;
    for (const intro of intros) longest = Math.max(longest, intro.duration() + intro.delay());
    return longest * 1000;
}

/**
 * The scroll sections are five SplitTexts and twenty ScrollTriggers, none of
 * them needed until the reader moves. Built with the intro they block the main
 * thread exactly where the intro starts; built during it they stall its tail.
 * So they wait for the intro to finish and then go up one section at a time,
 * unless the reader scrolls first, in which case they are needed now.
 */
function deferBuild(tasks: Array<() => void>, notBeforeMs: number): () => void {
    const queue = tasks.slice();
    let cancelled = false;

    const idle = (window as Window & typeof globalThis & { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback;
    const soon = (run: () => void) => (idle ? idle.call(window, () => run(), { timeout: 300 }) : window.setTimeout(run, 0));

    const drainOne = () => {
        if (cancelled) return;
        queue.shift()?.();
        if (queue.length) soon(drainOne);
        else stopListening();
    };

    const drainAll = () => {
        if (cancelled) return;
        stopListening();
        while (queue.length) queue.shift()?.();
    };

    const onScroll = () => drainAll();
    const stopListening = () => window.removeEventListener('scroll', onScroll);

    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = window.setTimeout(() => soon(drainOne), notBeforeMs + DEFERRED_BUILD_GRACE_MS);

    return () => {
        cancelled = true;
        stopListening();
        clearTimeout(timer);
    };
}
