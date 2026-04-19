/**
 * Fuzzy matching utilities used by both omnibox and voice engine.
 */

/** Word-level fuzzy match — returns true if any meaningful word overlaps */
export function fuzzyMatch(needle, haystack) {
  const a = (needle   || '').toLowerCase().trim();
  const b = (haystack || '').toLowerCase().trim();
  if (!a || !b) return false;
  if (b.includes(a) || a.includes(b)) return true;
  return a.split(/\s+/).some((word) => word.length > 2 && b.includes(word));
}

/** Score a match: higher = more relevant (used for result ranking) */
export function matchScore(needle, haystack) {
  const a = (needle   || '').toLowerCase().trim();
  const b = (haystack || '').toLowerCase().trim();
  if (!a || !b) return 0;
  if (b === a)        return 100;
  if (b.startsWith(a)) return 80;
  if (b.includes(a))   return 60;
  if (a.includes(b))   return 50;
  const wordScore = a.split(/\s+/).reduce((max, w) => {
    if (w.length < 2) return max;
    if (b.includes(w)) return Math.max(max, 40);
    return max;
  }, 0);
  return wordScore;
}

/** Title-case a string */
export function titleCase(str) {
  return (str || '').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}
