import { getBackendUrl } from "@/lib/backend";

type RouteParams = {
  path: string[];
};

async function proxyCodingInterview(
  request: Request,
  context: { params: Promise<RouteParams> },
) {
  try {
    const { path } = await context.params;
    const backendUrl = getBackendUrl(
      `/api/coding-interviews/${path.map(encodeURIComponent).join("/")}`,
    );
    const requestUrl = new URL(request.url);

    requestUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const headers = new Headers({ Accept: "application/json" });
    const inviteToken = request.headers.get("x-coding-invite-token");
    const contentType = request.headers.get("content-type");

    if (inviteToken) headers.set("x-coding-invite-token", inviteToken);
    if (contentType) headers.set("content-type", contentType);

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "The coding interview service is unavailable. Please try again." },
      { status: 502 },
    );
  }
}

export const GET = proxyCodingInterview;
export const POST = proxyCodingInterview;
