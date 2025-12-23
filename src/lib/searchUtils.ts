/**
 * Escapes special characters in LIKE patterns to prevent SQL pattern injection.
 * 
 * In PostgreSQL LIKE queries, % and _ have special meaning:
 * - % matches any sequence of characters
 * - _ matches any single character
 * 
 * If user input contains these characters without escaping, it can:
 * - Match more records than intended (e.g., entering "%" matches everything)
 * - Be used to probe the database structure
 * 
 * This function escapes these special characters so they are treated literally.
 */
export function escapeLikePattern(input: string): string {
  // Escape backslashes first, then % and _
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}
