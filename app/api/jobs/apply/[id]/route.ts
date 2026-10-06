import { getBackendUrl } from "@/lib/backend";

export async function POST(
  request: Request,
  context: RouteContext<"/api/jobs/apply/[id]">,
) {
  const { id } = await context.params;

  try {
    const response = await fetch(getBackendUrl(`/api/jobs/${id}/apply`), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({}),
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
        message: "Unable to apply for this job",
      },
      { status: 502 },
    );
  }
}
