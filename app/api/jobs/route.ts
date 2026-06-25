import { getBackendUrl } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const backendUrl = getBackendUrl("/api/jobs");
    const requestUrl = new URL(request.url);

    requestUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl, {
      headers: {
        Accept: "application/json",
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
        message: "Unable to fetch jobs",
        data: [],
      },
      { status: 502 },
    );
  }
}
