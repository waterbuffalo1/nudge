import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SITE_AUTH_COOKIE,
  siteAuthToken,
  sitePasswordConfigured,
} from "./lib/site-auth";

export async function middleware(request: NextRequest) {
  if (!sitePasswordConfigured()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const expected = await siteAuthToken(process.env.SITE_PASSWORD!.trim());
  const cookie = request.cookies.get(SITE_AUTH_COOKIE)?.value;
  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
