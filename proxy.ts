import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession, isOwner } from "@/app/lib/session";

export function proxy(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    return session
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Creation pages are owner-only; send everyone else back to the list.
  const createMatch = pathname.match(/^\/(bits|hunks|sets)\/new\/?$/);
  if (createMatch && !isOwner(session)) {
    return NextResponse.redirect(new URL(`/${createMatch[1]}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except auth routes, Next internals, and public assets.
    "/((?!auth/|_next/static|_next/image|favicon\\.png|og\\.png|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
