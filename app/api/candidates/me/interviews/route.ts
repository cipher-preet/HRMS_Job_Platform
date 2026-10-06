import { getBackendUrl } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const response = await fetch(getBackendUrl("/api/candidates/me/interviews"), {
      headers: {
        Accept: "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to fetch interviews", data: { interviews: [] } },
      { status: 502 },
    );
  }
}
