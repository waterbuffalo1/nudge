import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export const DEVICE_ID_COOKIE = "nudge_device_id";

export async function getDeviceId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(DEVICE_ID_COOKIE)?.value;
}

export function createDeviceId(): string {
  return randomUUID();
}
