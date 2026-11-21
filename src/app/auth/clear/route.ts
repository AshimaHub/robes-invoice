import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/** Clears stale/legacy session cookies, then sends the user to login. */
export async function GET(request: Request) {
  await clearSessionCookie();
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
