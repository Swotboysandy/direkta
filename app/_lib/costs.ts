/**
 * Token estimates the interface shows beside a generate button.
 *
 * The server's measured costs live in `lib/usage.ts` (`TOKEN_COSTS`), but that
 * module opens the database and cannot be imported by a client component.
 * This is the client-side mirror of the one number the stages quote — keep
 * it equal to `TOKEN_COSTS.image`.
 */
export const IMAGE_TOKENS = 14_400;

/** "≈14k tok" — the short form every generate button uses. */
export function tokensLabel(tokens: number): string {
  return `≈${Math.round(tokens / 1000)}k tok`;
}
