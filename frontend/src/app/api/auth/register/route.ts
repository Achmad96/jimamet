import { NextResponse } from "next/server";

const DJANGO_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const djangoRes = await fetch(`${DJANGO_API}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await djangoRes.json();

    if (!djangoRes.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || "Registrasi gagal." },
        { status: djangoRes.status }
      );
    }

    // Build response
    const response = NextResponse.json({
      success: true,
      user: data.user,
      role: data.role || "user",
    });

    // Set auth cookie if token is returned on registration
    if (data.token) {
      response.cookies.set({
        name: "auth_token",
        value: data.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      response.cookies.set({
        name: "auth_role",
        value: data.role || "user",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Tidak dapat terhubung ke server." },
      { status: 500 }
    );
  }
}
