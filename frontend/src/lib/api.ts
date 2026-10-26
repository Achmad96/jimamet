/**
 * Jimamet API Client
 * All requests go through Next.js API routes (proxy) which handle
 * auth tokens via HttpOnly cookies. The browser never sees raw tokens.
 *
 * Includes in-memory request caching with TTL for frequently-accessed data.
 */

// ═══════════════════════════════════════════════════
//  IN-MEMORY REQUEST CACHE
// ═══════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry<unknown>>();

/** TTLs in milliseconds */
const CACHE_TTL = {
  profile: 5 * 60 * 1000,       // 5 min
  dashboard: 30 * 1000,          // 30s
  coachSessions: 15 * 1000,      // 15s
  foodRecords: 60 * 1000,        // 1 min
} as const;

function cacheGet<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttlMs: number) {
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function cacheInvalidate(...prefixes: string[]) {
  for (const key of _cache.keys()) {
    if (prefixes.some((p) => key.startsWith(p))) {
      _cache.delete(key);
    }
  }
}

/** Clear all client cache (e.g. on logout) */
export function clearApiCache() {
  _cache.clear();
}

// ── Base Fetch Helper ──
// All requests go through the Next.js proxy which adds the auth header
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  return fetch(`/api/proxy${endpoint}`, {
    ...options,
    headers,
  });
}

// ═══════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════

export async function apiRegister(data: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  age?: number;
  weight?: number;
  height?: number;
  activity_level?: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiLogin(data: { username: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiLogout() {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  clearApiCache();
  return { ok: res.ok };
}

export async function apiGetMe() {
  const res = await fetch("/api/auth/me");
  const json = await res.json();
  return { ok: res.ok, data: json };
}

// ═══════════════════════════════════════════════════
//  USER PROFILE (cached 5 min)
// ═══════════════════════════════════════════════════

export async function apiGetProfile() {
  const cacheKey = "profile";
  const cached = cacheGet<{ ok: boolean; data: unknown }>(cacheKey);
  if (cached) return cached;

  const res = await apiFetch("/profile/");
  const json = await res.json();
  const result = { ok: res.ok, data: json };
  if (res.ok) cacheSet(cacheKey, result, CACHE_TTL.profile);
  return result;
}

export async function apiUpdateProfile(data: Record<string, unknown>) {
  const res = await apiFetch("/profile/update/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  // Invalidate profile cache on mutation
  cacheInvalidate("profile");
  return { ok: res.ok, data: json };
}

// ═══════════════════════════════════════════════════
//  FOOD RECORDS (cached 1 min)
// ═══════════════════════════════════════════════════

export async function apiListFoodRecords(params?: {
  date_from?: string;
  date_to?: string;
}) {
  const query = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  const cacheKey = `foodRecords:${query}`;

  if (!query) {
    const cached = cacheGet<{ ok: boolean; data: unknown }>(cacheKey);
    if (cached) return cached;
  }

  const res = await apiFetch(`/food/${query}`);
  const json = await res.json();
  const result = { ok: res.ok, data: json };
  if (res.ok && !query) cacheSet(cacheKey, result, CACHE_TTL.foodRecords);
  return result;
}

export async function apiCreateFoodRecord(data: {
  food_name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  portion?: string;
  emoji?: string;
  consumed_at?: string;
  confidence?: number;
  image_url?: string;
  tags?: string[];
  recommendation?: string;
}) {
  const res = await apiFetch("/food/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  // Invalidate food + dashboard caches
  cacheInvalidate("foodRecords", "dashboard");
  return { ok: res.ok, data: json };
}

export async function apiGetFoodRecord(id: string) {
  const res = await apiFetch(`/food/${id}/`);
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiDeleteFoodRecord(id: string) {
  const res = await apiFetch(`/food/${id}/delete/`, { method: "DELETE" });
  cacheInvalidate("foodRecords", "dashboard");
  return { ok: res.ok };
}

// ═══════════════════════════════════════════════════
//  DASHBOARD SUMMARY (cached 30s)
// ═══════════════════════════════════════════════════

export async function apiDashboardSummary(date?: string) {
  const query = date ? `?date=${date}` : "";
  const cacheKey = `dashboard:${query}`;
  const cached = cacheGet<{ ok: boolean; data: unknown }>(cacheKey);
  if (cached) return cached;

  const res = await apiFetch(`/dashboard/summary/${query}`);
  const json = await res.json();
  const result = { ok: res.ok, data: json };
  if (res.ok) cacheSet(cacheKey, result, CACHE_TTL.dashboard);
  return result;
}

// ═══════════════════════════════════════════════════
//  CONSULTATIONS (Coach → Nutritionist)
// ═══════════════════════════════════════════════════

export async function apiListConsultations() {
  const res = await apiFetch("/consultations/");
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiCreateConsultation(coach_message: string) {
  const res = await apiFetch("/consultations/create/", {
    method: "POST",
    body: JSON.stringify({ coach_message }),
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiUpdateConsultation(
  id: string,
  data: { status?: string; nutritionist_notes?: string; handled_by?: string }
) {
  const res = await apiFetch(`/consultations/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiDeleteConsultation(id: string) {
  const res = await apiFetch(`/consultations/${id}/delete/`, {
    method: "DELETE",
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiGetPatientDetails(consultationId: string) {
  const res = await apiFetch(`/consultations/${consultationId}/patient/`);
  const json = await res.json();
  return { ok: res.ok, data: json };
}

// ═══════════════════════════════════════════════════
//  CONSULTATION CHAT (User ↔ Nutritionist)
// ═══════════════════════════════════════════════════

export async function apiListChat(consultationId: string) {
  const res = await apiFetch(`/consultations/${consultationId}/chat/`);
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiSendChat(
  consultationId: string,
  message: string,
  sender: "user" | "nutritionist"
) {
  const res = await apiFetch(`/consultations/${consultationId}/chat/send/`, {
    method: "POST",
    body: JSON.stringify({ message, sender }),
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiDeleteChat(chatId: string) {
  const res = await apiFetch(`/chat/${chatId}/delete/`, {
    method: "DELETE",
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

// ═══════════════════════════════════════════════════
//  NUTRICOACH AI (Coach Sessions — cached 15s)
// ═══════════════════════════════════════════════════

export async function apiListCoachSessions() {
  const cacheKey = "coachSessions:list";
  const cached = cacheGet<{ ok: boolean; data: unknown }>(cacheKey);
  if (cached) return cached;

  const res = await apiFetch("/coach/sessions/");
  const json = await res.json();
  const result = { ok: res.ok, data: json };
  if (res.ok) cacheSet(cacheKey, result, CACHE_TTL.coachSessions);
  return result;
}

export async function apiCreateCoachSession(title?: string) {
  const res = await apiFetch("/coach/sessions/create/", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
  const json = await res.json();
  cacheInvalidate("coachSessions");
  return { ok: res.ok, data: json };
}

export async function apiGetCoachSession(sessionId: string) {
  const res = await apiFetch(`/coach/sessions/${sessionId}/`);
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiDeleteCoachSession(sessionId: string) {
  const res = await apiFetch(`/coach/sessions/${sessionId}/delete/`, {
    method: "DELETE",
  });
  const json = await res.json();
  cacheInvalidate("coachSessions");
  return { ok: res.ok, data: json };
}

export async function apiSendCoachMessage(sessionId: string, message: string) {
  const res = await apiFetch(`/coach/sessions/${sessionId}/chat/`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  const json = await res.json();
  // Invalidate session list cache since updated_at changes
  cacheInvalidate("coachSessions");
  return { ok: res.ok, data: json };
}


// ═══════════════════════════════════════════════════
//  FOOD DETECTION (Real-time Vision & Video)
// ═══════════════════════════════════════════════════

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api`
    : "http://127.0.0.1:8000/api");

export function getWsConsultationUrl(consultationId: string): string {
  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const host = window.location.hostname || "127.0.0.1";
    const proto = isHttps ? "wss:" : "ws:";
    return `${proto}//${host}:8000/ws/consultation/${consultationId}/`;
  }
  return `ws://127.0.0.1:8000/ws/consultation/${consultationId}/`;
}

export function getWsDetectUrl(): string {
  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const host = window.location.hostname || "127.0.0.1";
    const proto = isHttps ? "wss:" : "ws:";
    return `${proto}//${host}:8000/ws/detect-stream/`;
  }
  return "ws://127.0.0.1:8000/ws/detect-stream/";
}

export async function apiDetectFood(formData: FormData, fast = false) {
  const url = `${API_BASE_URL}/detect-food/${fast ? "?fast=1" : ""}`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiDetectFrame(payload: {
  frame: string;
  conf?: number;
  imgsz?: number;
  fast?: boolean;
}) {
  const url = `${API_BASE_URL}/detect-frame/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

export async function apiDetectVideo(formData: FormData) {
  const url = `${API_BASE_URL}/detect-video/`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}
