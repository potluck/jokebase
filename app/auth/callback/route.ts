import { NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  encodeSession,
  safeNext,
  sessionCookieOptions,
} from "@/app/lib/session";

function fail(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");

  let stored: { state: string; next: string } | null = null;
  try {
    stored = JSON.parse(request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? "");
  } catch {}

  if (!code || !state || !stored || stored.state !== state) {
    return fail(request, "state");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${request.nextUrl.origin}/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail(request, "token");
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  if (!userRes.ok) return fail(request, "userinfo");
  const user = (await userRes.json()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!user.email || !user.email_verified) return fail(request, "email");

  const response = NextResponse.redirect(
    new URL(safeNext(stored.next), request.url)
  );
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.set(
    SESSION_COOKIE,
    encodeSession({
      email: user.email,
      name: user.name ?? user.email,
      picture: user.picture,
    }),
    sessionCookieOptions
  );
  return response;
}
