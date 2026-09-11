import { getBackendUrl } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.formData();

    const response = await fetch(getBackendUrl("/api/candidates/verification-video"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body,
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
        message: "Unable to upload verification video",
      },
      { status: 502 },
    );
  }
}
