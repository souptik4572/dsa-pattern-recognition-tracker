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
