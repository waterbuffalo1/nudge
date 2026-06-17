import { NextResponse } from "next/server";
import {
  getCompletedActivitySlugs,
  markActivityComplete,
  unmarkActivityComplete,
} from "@/lib/completions";
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
    const categorySlug = searchParams.get("category");
    const timeZone = resolveTimeZone(searchParams.get("timezone"));

    if (!categorySlug) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 },
      );
    }

    const { deviceId, isNew } = await resolveDeviceId();
    const completed = isNew
      ? []
      : await getCompletedActivitySlugs({ deviceId, categorySlug, timeZone });

    const response = NextResponse.json({
      completed,
      nudgeDate: getNudgeDate(new Date(), timeZone),
    });

    if (isNew) {
      withDeviceCookie(response, deviceId);
    }

    return response;
  } catch (error) {
    console.error("GET /api/completions failed", error);
    return NextResponse.json(
      { error: "Failed to load completions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      categorySlug?: string;
      activitySlug?: string;
      timezone?: string;
    };

    const categorySlug = body.categorySlug;
    const activitySlug = body.activitySlug;
    const timeZone = resolveTimeZone(body.timezone ?? null);

    if (!categorySlug || !activitySlug) {
      return NextResponse.json(
        { error: "categorySlug and activitySlug are required" },
        { status: 400 },
      );
    }

    const { deviceId, isNew } = await resolveDeviceId();
    await markActivityComplete({
      deviceId,
      categorySlug,
      activitySlug,
      timeZone,
    });

    const response = NextResponse.json({
      ok: true,
      nudgeDate: getNudgeDate(new Date(), timeZone),
    });

    if (isNew) {
      withDeviceCookie(response, deviceId);
    }

    return response;
  } catch (error) {
    console.error("POST /api/completions failed", error);
    return NextResponse.json(
      { error: "Failed to save completion" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      categorySlug?: string;
      activitySlug?: string;
      timezone?: string;
    };

    const categorySlug = body.categorySlug;
    const activitySlug = body.activitySlug;
    const timeZone = resolveTimeZone(body.timezone ?? null);

    if (!categorySlug || !activitySlug) {
      return NextResponse.json(
        { error: "categorySlug and activitySlug are required" },
        { status: 400 },
      );
    }

    const { deviceId, isNew } = await resolveDeviceId();

    if (!isNew) {
      await unmarkActivityComplete({
        deviceId,
        categorySlug,
        activitySlug,
        timeZone,
      });
    }

    const response = NextResponse.json({
      ok: true,
      nudgeDate: getNudgeDate(new Date(), timeZone),
    });

    if (isNew) {
      withDeviceCookie(response, deviceId);
    }

    return response;
  } catch (error) {
    console.error("DELETE /api/completions failed", error);
    return NextResponse.json(
      { error: "Failed to remove completion" },
      { status: 500 },
    );
  }
}
