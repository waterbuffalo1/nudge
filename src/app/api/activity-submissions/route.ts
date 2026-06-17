import { NextResponse } from "next/server";
import {
  listActivitySubmissions,
  submitActivitySubmission,
  updateActivitySubmissionStatus,
} from "@/lib/activity-submissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (status && !["open", "done"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const submissions = await listActivitySubmissions(
      status ? (status as "open" | "done") : undefined,
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET /api/activity-submissions failed", error);
    return NextResponse.json(
      { error: "Failed to load submissions" },
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
      activitySlug?: string;
      deviceId?: string;
    };

    const categorySlug = body.categorySlug?.trim();
    const name = body.name?.trim();

    if (!categorySlug || !name) {
      return NextResponse.json(
        { error: "categorySlug and name are required" },
        { status: 400 },
      );
    }

    const submission = await submitActivitySubmission({
      categorySlug,
      name,
      emoji: body.emoji?.trim() || undefined,
      doneMessage: body.doneMessage?.trim() || undefined,
      activitySlug: body.activitySlug?.trim() || undefined,
      deviceId: body.deviceId?.trim() || undefined,
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("POST /api/activity-submissions failed", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: number;
      status?: "open" | "done";
    };

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 },
      );
    }

    if (!["open", "done"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const submission = await updateActivitySubmissionStatus(
      body.id,
      body.status,
    );

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("PATCH /api/activity-submissions failed", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 },
    );
  }
}
