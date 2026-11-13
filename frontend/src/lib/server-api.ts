import { cookies } from "next/headers";

const DJANGO_API = (
  process.env.DJANGO_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export interface ServerApiResult<T> {
  ok: boolean;
  data: T | null;
  status: number;
  error?: string;
}

/**
 * Server-side API fetcher for Server Components.
 * Reads the HttpOnly auth_token cookie and calls Django directly.
 */
export async function serverApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ServerApiResult<T>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${DJANGO_API}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      cache: options.cache || "no-store",
    });

    if (res.status === 204) {
      return { ok: true, data: null, status: 204 };
    }

    if (!res.ok) {
      return { ok: false, data: null, status: res.status, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    return { ok: false, data: null, status: 500, error: errorMsg };
  }
}

// ── Specialized Server-side Fetchers ──

export async function getServerMe() {
  return serverApiFetch<{ id: string; username: string; email: string; full_name?: string; role?: string }>(
    "/auth/me/"
  );
}

export async function getServerProfile() {
  return serverApiFetch<{
    full_name?: string;
    email?: string;
    username?: string;
    age?: number;
    weight?: number;
    height?: number;
    gender?: "male" | "female";
    activity_level?: string;
    goal?: string;
    target_calories?: number;
    is_profile_completed?: boolean;
  }>("/profile/");
}

export async function getServerDashboardSummary() {
  return serverApiFetch<{
    total_calories: number;
    target_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    meals: Array<{
      id?: string | number;
      food_name?: string;
      nama_makanan?: string;
      recorded_at?: string;
      tanggal?: string;
      calories?: number;
      kalori?: number;
    }>;
    weekly_data: Array<{ date: string; calories: number }>;
  }>("/dashboard/summary/");
}

export async function getServerFoodRecords() {
  return serverApiFetch<Array<{
    id: string;
    food_name?: string;
    nama_makanan?: string;
    recorded_at?: string;
    tanggal?: string;
    calories?: number;
    kalori?: number;
    protein?: number;
    carbs?: number;
    karbohidrat?: number;
    fat?: number;
    lemak?: number;
    image?: string;
    gambar_url?: string;
  }>>("/food-records/");
}

export async function getServerConsultations() {
  return serverApiFetch<Array<{
    id: string;
    user_id?: string;
    full_name?: string;
    coach_message?: string;
    nutritionist_notes?: string;
    status: "pending" | "completed" | "cancelled";
    handled_by?: string;
    created_at: string;
    unread_count?: number;
  }>>("/consultations/");
}

export async function getServerPatientDetails(consultationId: string) {
  return serverApiFetch<{
    profile: {
      full_name?: string;
      age?: number;
      weight?: number;
      height?: number;
      gender?: string;
      activity_level?: string;
      goal?: string;
      target_calories?: number;
    } | null;
    food_history: Array<{
      id: string;
      food_name?: string;
      recorded_at?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }>;
    consultation: {
      id: string;
      status: string;
      handled_by?: string;
      nutritionist_notes?: string;
      created_at: string;
    } | null;
  }>(`/consultations/${consultationId}/patient-details/`);
}

export async function getServerChat(consultationId: string) {
  return serverApiFetch<Array<{
    id: string;
    consultation_id?: string;
    sender: "user" | "nutritionist";
    message: string;
    sent_at?: string;
  }>>(`/consultations/${consultationId}/chat/`);
}

export async function getServerCoachSessions() {
  return serverApiFetch<Array<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>>("/coach/sessions/");
}

export async function getServerCoachSession(sessionId: string) {
  return serverApiFetch<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: Array<{
      id: string;
      session_id: string;
      sender: "user" | "ai";
      message: string;
      needs_consultation: boolean;
      sent_at: string;
    }>;
  }>(`/coach/sessions/${sessionId}/`);
}

