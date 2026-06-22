import { NextResponse } from "next/server";
import {
  getCompletedActivitySlugs,
  markActivityComplete,
  unmarkActivityComplete,
} from "@/lib/completions";
import {
  resolveDeviceId,
  resolveTimeZone,
  withDeviceCookie,
} from "@/lib/api-route";
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
