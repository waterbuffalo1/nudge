export const SITE_AUTH_COOKIE = "nudge_site_auth";

export async function siteAuthToken(password: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`nudge-site-auth:${password}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function sitePasswordConfigured(): boolean {
  return Boolean(process.env.SITE_PASSWORD?.trim());
}
