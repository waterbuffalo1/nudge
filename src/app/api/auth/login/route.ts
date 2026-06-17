import { NextResponse } from "next/server";
import { SITE_AUTH_COOKIE, siteAuthToken } from "@/lib/site-auth";

export async function POST(request: Request) {
  const sitePassword = process.env.SITE_PASSWORD?.trim();
  if (!sitePassword) {
    return NextResponse.json(
      { error: "Site password is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { password?: string };
  const password = body.password?.trim();
  if (!password || password !== sitePassword) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = await siteAuthToken(sitePassword);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
