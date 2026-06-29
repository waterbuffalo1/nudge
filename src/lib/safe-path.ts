/** Returns a same-origin path safe for client-side redirects after login. */
export function safeInternalPath(from: string | null | undefined): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return "/";
  }

  if (from.startsWith("/login")) {
    return "/";
  }

  return from;
}
