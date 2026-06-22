export function getClientTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
