/** Slot ids reuse the original tracker's storage key, so exported progress imports as-is. */
export function slotId(patternId: string, problemId: number): string {
  return `${patternId}:${problemId}`;
}

export function patternSlug(patternId: string): string {
  return patternId.replace(".", "-");
}

export function patternIdFromSlug(slug: string): string {
  return slug.replace("-", ".");
}

/** DOM id of a pattern's panel on /patterns, used as the link fragment. */
export function patternAnchor(patternId: string): string {
  return `pattern-${patternSlug(patternId)}`;
}

/** Opens a pattern's problem list on /patterns and scrolls to it. */
export function patternHref(patternId: string): string {
  return `/patterns?open=${patternId}#${patternAnchor(patternId)}`;
}
