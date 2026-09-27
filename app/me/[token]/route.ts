import { NextResponse, type NextRequest } from "next/server";
import { getViewerForToken } from "@/lib/server/data";
import { SESSION_COOKIE, isWellFormedToken, sessionCookieOptions } from "@/lib/server/session";

// Personal "use on another device" link: stores the participant token in this browser.
export async function GET(request: NextRequest, { params }: RouteContext<"/me/[token]">) {
  const { token } = await params;
  const viewer = isWellFormedToken(token) ? await getViewerForToken(token) : null;
  if (!viewer) return NextResponse.redirect(new URL("/?notice=invalid-link", request.url));

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
