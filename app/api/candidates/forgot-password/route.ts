const BACKEND_URL = "http://localhost:4000/api/candidates/forgot-password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to request a password reset",
      },
      { status: 502 },
    );
  }
}
