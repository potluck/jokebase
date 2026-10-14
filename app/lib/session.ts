import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "jokebase_session";
export const OAUTH_STATE_COOKIE = "jokebase_oauth_state";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type Session = {
  email: string;
  name: string;
  picture?: string;
  exp: number; // unix seconds
};

function secret() {
  const s = process.env.AUTH_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!s) throw new Error("AUTH_SECRET or GOOGLE_CLIENT_SECRET must be set");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(data: Omit<Session, "exp">): string {
  const session: Session = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): Session | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as Session;
    if (session.exp < Date.now() / 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

// Only allow same-origin relative paths to avoid open redirects.
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

// The only account allowed to change anything. Everyone else is read-only.
export const OWNER_EMAIL = "potluck.mittal@gmail.com";

export function isOwner(session: Session | null): boolean {
  return session?.email.toLowerCase() === OWNER_EMAIL;
}

export async function requireOwner(): Promise<void> {
  if (!isOwner(await getSession())) throw new Error("Read-only access");
}
