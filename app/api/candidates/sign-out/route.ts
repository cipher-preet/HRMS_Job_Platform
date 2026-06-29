import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend";

const COOKIE_DELETE_OPTIONS = {
  expires: new Date(0),
  maxAge: 0,
  path: "/",
} as const;

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";

  try {
    await fetch(getBackendUrl("/api/candidates/logout"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    // Local cookie cleanup below is the source of truth for the UI session.
  }

  const response = NextResponse.json({
    success: true,
    message: "Signed out successfully",
  });
  const cookieStore = await cookies();

  cookieStore.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, "", COOKIE_DELETE_OPTIONS);
  });

  return response;
}
