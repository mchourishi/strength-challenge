import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

// Private-link access: each participant has a random token kept in an httpOnly cookie.
// Only its SHA-256 hash is stored in the database.

export const SESSION_COOKIE = "st_participant";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(token);
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token && isWellFormedToken(token) ? token : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
};

/** Only callable from Server Actions and Route Handlers. */
export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
