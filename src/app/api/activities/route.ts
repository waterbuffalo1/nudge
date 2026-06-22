import { NextResponse } from "next/server";
import { submitActivitySubmission } from "@/lib/activity-submissions";
import {
  resolveDeviceId,
  resolveTimeZone,
  withDeviceCookie,
} from "@/lib/api-route";
import {
  createCustomActivity,
  getCustomActivities,
  validateCustomActivityInput,
} from "@/lib/custom-activities";
import { getNudgeDate } from "@/lib/nudge-date";

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
    const activities = isNew
      ? []
      : await getCustomActivities({ deviceId, categorySlug, timeZone });

    const response = NextResponse.json({
      activities,
      nudgeDate: getNudgeDate(new Date(), timeZone),
    });

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
      timezone?: string;
    };

    const categorySlug = body.categorySlug;
    const timeZone = resolveTimeZone(body.timezone ?? null);
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
      timeZone,
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

    const response = NextResponse.json({
      activity,
      nudgeDate: getNudgeDate(new Date(), timeZone),
    });

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
