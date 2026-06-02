export type ContentViolation = 'url' | 'profanity';

export interface ScreenResult {
  ok: boolean;
  violation?: ContentViolation;
  message?: string;
}

/**
 * Detects hyperlink patterns: protocol-prefixed URLs, www. subdomains, and
 * bare registered-domain references. Run first since the signal is unambiguous.
 */
const URL_RE =
  /https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|co|app|dev|me|info|biz|ly|gl|gg)\b/i;

/**
 * Core profanity list — word-boundary anchored so partial matches inside
 * legitimate words (e.g. "assassin", "scunthorpe", "clbuttic") are not flagged.
 * Each pattern is case-insensitive.
 */
const PROFANITY_LIST: RegExp[] = [
  /\bfuck(ing?|er|ed|s)?\b/i,
  /\bshit(ty|ter|s)?\b/i,
  /\basshole(s)?\b/i,
  /\bbitch(es|ing)?\b/i,
  /\bcunt(s)?\b/i,
  /\bdick(head|s)?\b/i,
  /\bpussy(s|cat)?\b/i,
  /\bcock(s|sucker)?\b/i,
  /\bwtf\b/i,
  /\bstfu\b/i,
  /\bn[i1][g9]{2}[e3]r(s)?\b/i,
  /\bf[a4@][g9](s|got)?\b/i,
  /\bretard(ed|s)?\b/i,
  /\bk[i1]ke(s)?\b/i,
  /\bsp[i1]c(s)?\b/i,
  /\bch[i1]nk(s)?\b/i,
  /\bwetback(s)?\b/i,
  /\bdyke(s)?\b/i,
  /\btr[a4]nn[y1](s)?\b/i,
];

/**
 * Screens one or more text strings for disallowed URLs and profanity.
 * Strings are joined with a space before checking so callers can pass
 * individual fields without pre-concatenating.
 *
 * Returns `{ ok: true }` when content is clean, or a ScreenResult with
 * `ok: false`, a `violation` type, and a user-facing `message`.
 */
export function screenContent(...texts: string[]): ScreenResult {
  const combined = texts.filter(Boolean).join(' ');

  if (URL_RE.test(combined)) {
    return {
      ok: false,
      violation: 'url',
      message: "Links aren't allowed in posts or comments.",
    };
  }

  for (const re of PROFANITY_LIST) {
    if (re.test(combined)) {
      return {
        ok: false,
        violation: 'profanity',
        message: "Your content contains language that isn't allowed.",
      };
    }
  }

  return { ok: true };
}
