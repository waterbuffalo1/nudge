import { NextResponse } from "next/server";
import { submitActivitySubmission } from "@/lib/activity-submissions";
import {
  createCustomActivity,
  getCustomActivities,
  validateCustomActivityInput,
} from "@/lib/custom-activities";
import { createDeviceId, DEVICE_ID_COOKIE, getDeviceId } from "@/lib/device-id";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

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

    if (!categorySlug) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 },
      );
    }

    const { deviceId, isNew } = await resolveDeviceId();
    const activities = isNew
      ? []
      : await getCustomActivities({ deviceId, categorySlug });

    const response = NextResponse.json({ activities });

    if (isNew) {
      withDeviceCookie(response, deviceId);
    }

    return response;
  } catch (error) {
    console.error("GET /api/activities failed", error);
    return NextResponse.json(
      { error: "Failed to load activities" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      categorySlug?: string;
      name?: string;
      emoji?: string;
      doneMessage?: string;
      sendToMakers?: boolean;
    };

    const categorySlug = body.categorySlug;
    if (!categorySlug) {
      return NextResponse.json(
        { error: "categorySlug is required" },
        { status: 400 },
      );
    }

    const validation = validateCustomActivityInput({
      name: body.name ?? "",
      emoji: body.emoji,
      doneMessage: body.doneMessage,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { deviceId, isNew } = await resolveDeviceId();
    const activity = await createCustomActivity({
      deviceId,
      categorySlug,
      input: validation.data,
    });

    if (body.sendToMakers) {
      await submitActivitySubmission({
        categorySlug,
        name: validation.data.name,
        emoji: validation.data.emoji || undefined,
        doneMessage: validation.data.doneMessage,
        activitySlug: activity.slug,
        deviceId,
      });
    }

    const response = NextResponse.json({ activity });

    if (isNew) {
      withDeviceCookie(response, deviceId);
    }

    return response;
  } catch (error) {
    console.error("POST /api/activities failed", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 },
    );
  }
}
