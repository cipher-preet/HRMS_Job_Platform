import { getBackendUrl } from "@/lib/backend";

export async function GET(_request: Request, context: RouteContext<"/api/jobs/[id]">) {
  const { id } = await context.params;

  try {
    const response = await fetch(getBackendUrl(`/api/jobs/${id}`), {
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
        message: "Unable to fetch job detail",
        data: null,
      },
      { status: 502 },
    );
  }
}
