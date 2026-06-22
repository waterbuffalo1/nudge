import { NextResponse } from "next/server";
import { createDeviceId, DEVICE_ID_COOKIE, getDeviceId } from "@/lib/device-id";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value: string | null): string {
  if (value && isValidTimeZone(value)) {
    return value;
  }
  return "UTC";
}

export function withDeviceCookie(response: NextResponse, deviceId: string) {
  response.cookies.set(DEVICE_ID_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export async function resolveDeviceId(): Promise<{
  deviceId: string;
  isNew: boolean;
}> {
  const existing = await getDeviceId();
  if (existing) {
    return { deviceId: existing, isNew: false };
  }
  return { deviceId: createDeviceId(), isNew: true };
}
