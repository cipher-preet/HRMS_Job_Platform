import { getBackendUrl } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const response = await fetch(getBackendUrl("/api/candidates/me"), {
      headers: {
        Accept: "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Candidate login is required",
      },
      { status: 502 },
    );
  }
}
