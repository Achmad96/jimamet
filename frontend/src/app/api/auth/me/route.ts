import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const djangoRes = await fetch(`${DJANGO_API}/auth/me/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    if (!djangoRes.ok) {
      // Token invalid/expired — clear cookies
      const response = NextResponse.json(
        { error: "Token tidak valid." },
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

    const data = await djangoRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil data user." },
      { status: 500 }
    );
  }
}
