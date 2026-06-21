import { NextResponse } from "next/server";
import { getCategoryProgressForDevice } from "@/lib/category-progress";
import { createDeviceId, DEVICE_ID_COOKIE, getDeviceId } from "@/lib/device-id";
import { getNudgeDate } from "@/lib/nudge-date";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(value: string | null): string {
  if (value && isValidTimeZone(value)) {
    return value;
  }
  return "UTC";
}

function withDeviceCookie(response: NextResponse, deviceId: string) {
  response.cookies.set(DEVICE_ID_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

async function resolveDeviceId(): Promise<{ deviceId: string; isNew: boolean }> {
  const existing = await getDeviceId();
  if (existing) {
    return { deviceId: existing, isNew: false };
  }
  return { deviceId: createDeviceId(), isNew: true };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeZone = resolveTimeZone(searchParams.get("timezone"));
    const { deviceId, isNew } = await resolveDeviceId();

    const progress = isNew
      ? {}
      : await getCategoryProgressForDevice({ deviceId, timeZone });

    const response = NextResponse.json({
      progress,
      nudgeDate: getNudgeDate(new Date(), timeZone),
    });

    if (isNew) {
      withDeviceCookie(response, deviceId);
    }

    return response;
  } catch (error) {
    console.error("GET /api/category-progress failed", error);
    return NextResponse.json(
      { error: "Failed to load category progress" },
      { status: 500 },
    );
  }
}
