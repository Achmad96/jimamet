import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    // Call Django logout if we have a token
    if (token) {
      await fetch(`${DJANGO_API}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      }).catch(() => {
        // Ignore errors — we still want to clear cookies
      });
    }

    // Clear both cookies
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    response.cookies.set({
      name: "auth_role",
      value: "",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Logout gagal." },
      { status: 500 }
    );
  }
}
