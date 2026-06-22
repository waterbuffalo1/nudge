import { NextResponse } from "next/server";
import {
  resolveDeviceId,
  resolveTimeZone,
  withDeviceCookie,
} from "@/lib/api-route";
import { getCategoryProgressForDevice } from "@/lib/category-progress";
import { getNudgeDate } from "@/lib/nudge-date";

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
