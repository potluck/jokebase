import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_STATE_COOKIE, safeNext } from "@/app/lib/session";

export function GET(request: NextRequest) {
  const state = randomBytes(16).toString("base64url");
  const next = safeNext(request.nextUrl.searchParams.get("next"));

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set(
    "redirect_uri",
    `${request.nextUrl.origin}/auth/callback`
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
