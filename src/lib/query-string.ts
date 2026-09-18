/**
 * Serialises a query string, leaving commas readable: multi-select values are comma lists
 * (`difficulty=easy,hard`), and commas are legal in a query string, so there's no need for %2C.
 */
export function serializeQuery(search: { toString(): string }): string {
  return search.toString().replaceAll("%2C", ",");
}
