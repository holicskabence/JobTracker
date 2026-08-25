/**
 * index.html sets `<base href="/">`, which makes a plain `href="#section"`
 * resolve against "/" instead of the current (language-prefixed) path -- turning
 * what should be a same-page scroll into a full navigation. Every in-page
 * anchor on the landing page therefore goes through here: the click is always
 * swallowed, and the page scrolls itself when the target exists.
 *
 * Placeholder links that have no section behind them yet (`href="#"`) simply do
 * nothing, which is still better than navigating away from the page.
 */
export function scrollToFragment(event: MouseEvent, fragment: string): void {
  event.preventDefault();

  if (fragment.length < 2) return;

  const target = document.querySelector(fragment);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
