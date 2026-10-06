import { getBackendUrl } from "@/lib/backend";

async function proxyMcqInterview(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const backendUrl = getBackendUrl(`/api/mcq-interviews/${path.map(encodeURIComponent).join("/")}`);
    const headers = new Headers({ Accept: "application/json" });
    const token = request.headers.get("x-mcq-invite-token");
    if (token) headers.set("x-mcq-invite-token", token);
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json(
      { success: false, message: "The MCQ interview service is unavailable." },
      { status: 502 },
    );
  }
}

export const GET = proxyMcqInterview;
export const POST = proxyMcqInterview;
