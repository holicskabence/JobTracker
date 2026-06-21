import { UrlMatchResult, UrlSegment, UrlSegmentGroup, Route } from '@angular/router';

export type AppLang = 'en' | 'hu';

export const SUPPORTED_LANGS: AppLang[] = ['en', 'hu'];

export function langMatcher(
  segments: UrlSegment[],
  group: UrlSegmentGroup,
  route: Route
): UrlMatchResult | null {
  if (segments.length === 0) return null;
  const first = segments[0];
  if (!SUPPORTED_LANGS.includes(first.path as AppLang)) return null;

  return {
    consumed: [first],
    posParams: { lang: first }
  };
}
