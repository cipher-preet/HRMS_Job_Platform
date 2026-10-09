import { getBackendUrl } from "@/lib/backend";

async function proxyIntegrity(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const backendUrl = getBackendUrl(`/api/interview-integrity/${path.map(encodeURIComponent).join("/")}`);
    const headers = new Headers({ Accept: "application/json" });
    for (const name of ["content-type", "authorization", "x-mcq-invite-token", "x-coding-invite-token"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
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
    return Response.json({ success: false, message: "The interview integrity service is unavailable." }, { status: 502 });
  }
}

export const GET = proxyIntegrity;
export const POST = proxyIntegrity;
