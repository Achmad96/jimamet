import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Catch-all proxy route.
 * Forwards requests from /api/proxy/[...path] → Django /api/[...path]
 * Injects the auth token from the HttpOnly cookie.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const { path } = await params;
    const djangoPath = path.join("/");
    const url = new URL(request.url);
    const queryString = url.search; // includes the "?"

    const targetUrl = `${DJANGO_API}/${djangoPath}/${queryString}`;

    // Build headers — forward Content-Type and add auth
    const headers: Record<string, string> = {};
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }

    // Forward the request body for methods that have one
    let body: string | null = null;
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      body = await request.text();
    }

    const djangoRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // If Django returns 401, clear cookies and return 401
    if (djangoRes.status === 401) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      response.cookies.set({
        name: "auth_token",
        value: "",
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
      response.cookies.set({
        name: "auth_role",
        value: "",
        httpOnly: false,
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    // For DELETE that may return 204 No Content
    if (djangoRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch {
    return NextResponse.json(
      { error: "Proxy request failed." },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
