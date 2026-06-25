import { getBackendUrl } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(getBackendUrl("/api/candidates/login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();
    const headers = new Headers();
    const setCookie = response.headers.get("set-cookie");

    if (setCookie) {
      headers.set("Set-Cookie", setCookie);
    }

    return Response.json(data, { headers, status: response.status });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to login candidate",
      },
      { status: 502 },
    );
  }
}
