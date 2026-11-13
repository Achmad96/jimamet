"use client";

import { useState, useEffect, useCallback, useMemo, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiListChat,
  apiSendChat,
  apiDeleteChat,
  apiUpdateConsultation,
  apiGetMe,
  getWsConsultationUrl,
} from "@/lib/api";
import { formatFoodLabel } from "@/lib/food-labels";

export interface ChatMsg {
  id: string;
  sender: "user" | "nutritionist";
  message: string;
  sent_at: string;
}

export interface PatientProfile {
  full_name?: string;
  email?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  activity_level?: string;
  goal?: string;
  daily_calorie_target?: number;
}

export interface FoodRecord {
  id: string;
  food_name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  recorded_at: string;
}

function formatDateShort(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const activityLabels: Record<string, string> = {
  sedentary: "Sedentari",
  light: "Ringan",
  moderate: "Moderat",
  active: "Aktif",
  veryActive: "Sangat Aktif",
};

const goalLabels: Record<string, string> = {
  lose: "Reduksi Massa",
  maintain: "Pemeliharaan",
  gain: "Surplus Anabolik",
};

interface PatientDetailClientProps {
  consultationId: string;
  initialProfile: PatientProfile | null;
  initialFoodHistory: FoodRecord[];
  initialStatus: string;
  initialCatatan: string;
  initialChat: ChatMsg[];
}

export function PatientDetailClient({
  consultationId,
  initialProfile,
  initialFoodHistory,
  initialStatus,
  initialCatatan,
  initialChat,
}: PatientDetailClientProps) {
  const router = useRouter();
  const profile = initialProfile;
  const foodHistory = initialFoodHistory;
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>(initialChat);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"profile" | "food">("profile");
  const [consultationStatus, setConsultationStatus] = useState<string>(initialStatus);
  const [catatan, setCatatan] = useState(initialCatatan);
  const [savingCatatan, setSavingCatatan] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const loadChat = useCallback(async () => {
    const { ok, data } = await apiListChat(consultationId);
    if (ok && Array.isArray(data)) {
      setChatMsgs(data);
    }
  }, [consultationId]);

  // WebSocket Live Updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(getWsConsultationUrl(consultationId));

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat_message") {
          setChatMsgs((prev) => {
            if (prev.some((m) => m.id === data.id && data.id !== "")) return prev;
            return [
              ...prev,
              {
                id: data.id || `ws-${Date.now()}`,
                sender: data.sender,
                message: data.message,
                sent_at: data.sent_at || new Date().toISOString(),
              },
            ];
          });
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    wsRef.current = ws;
  }, [consultationId]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const handleSend = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || chatSending) return;

      const text = chatInput.trim();
      setChatSending(true);
      setChatInput("");

      try {
        const { ok, data } = await apiSendChat(consultationId, text, "nutritionist");
        if (ok) {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                id: data?.id,
                message: text,
                sender: "nutritionist",
                sent_at: new Date().toISOString(),
              })
            );
          } else {
            setChatMsgs((prev) => [
              ...prev,
              {
                id: data?.id || `local-${Date.now()}`,
                sender: "nutritionist",
                message: text,
                sent_at: new Date().toISOString(),
              },
            ]);
          }
        } else {
          alert("Gagal mengirim pesan chat.");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChatSending(false);
      }
    },
    [chatInput, chatSending, consultationId]
  );

  const handleDeleteMsg = useCallback(
    async (msgId: string) => {
      if (!confirm("Hapus pesan ini?")) return;
      const { ok } = await apiDeleteChat(msgId);
      if (ok) {
        await loadChat();
      } else {
        alert("Gagal menghapus pesan.");
      }
    },
    [loadChat]
  );

  const handleSaveCatatan = useCallback(async () => {
    setSavingCatatan(true);
    const { ok } = await apiUpdateConsultation(consultationId, {
      nutritionist_notes: catatan,
    });
    setSavingCatatan(false);
    if (ok) {
      alert("Catatan klinis berhasil disimpan.");
    } else {
      alert("Gagal menyimpan catatan.");
    }
  }, [consultationId, catatan]);

  const handleTangani = useCallback(async () => {
    const { ok: meOk, data: me } = await apiGetMe();
    const nutritionistName = meOk && me ? me.full_name || me.username : "Ahli Gizi";

    const { ok } = await apiUpdateConsultation(consultationId, {
      status: "pending",
      handled_by: nutritionistName,
    });
    if (ok) {
      setConsultationStatus("active");
    } else {
      alert("Gagal mengambil alih konsultasi.");
    }
  }, [consultationId]);

  const handleComplete = useCallback(async () => {
    if (!confirm("Tandai konsultasi ini sebagai SELESAI?")) return;
    const { ok } = await apiUpdateConsultation(consultationId, {
      status: "completed",
      nutritionist_notes: catatan,
    });
    if (ok) {
      setConsultationStatus("completed");
      router.push("/ahli-gizi/pasien");
    } else {
      alert("Gagal menyelesaikan konsultasi.");
    }
  }, [consultationId, catatan, router]);

  const bmiInfo = useMemo(() => {
    if (profile?.weight && profile?.height) {
      const hMeter = profile.height / 100;
      return (profile.weight / (hMeter * hMeter)).toFixed(1);
    }
    return null;
  }, [profile?.weight, profile?.height]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left Sidebar: Patient Profile & History ── */}
      <aside className="flex w-96 flex-col border-r border-surface-high bg-surface-lowest">
        <div className="flex items-center justify-between border-b border-surface-high p-4">
          <Link
            href="/ahli-gizi/pasien"
            className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Daftar Pasien
          </Link>
          <div className="flex items-center gap-2">
            {consultationStatus === "active" && (
              <button
                onClick={handleComplete}
                className="cursor-pointer rounded-md bg-macro-cal px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
              >
                Selesaikan
              </button>
            )}
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                consultationStatus === "completed"
                  ? "bg-surface-high text-outline"
                  : "bg-primary-fixed text-primary"
              }`}
            >
              {consultationStatus}
            </span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-surface-container bg-surface-low">
          <button
            onClick={() => setSidebarTab("profile")}
            className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
              sidebarTab === "profile"
                ? "border-b-2 border-primary bg-surface-lowest text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Profil Pasien
          </button>
          <button
            onClick={() => setSidebarTab("food")}
            className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
              sidebarTab === "food"
                ? "border-b-2 border-primary bg-surface-lowest text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Log Makanan ({foodHistory.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {sidebarTab === "profile" ? (
            profile ? (
              <div className="flex flex-col gap-4 text-[13px]">
                <div className="flex items-center gap-3 pb-3 border-b border-surface-container">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-on-primary">
                    {profile.full_name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <h4 className="font-headline text-base font-bold text-on-surface">
                      {profile.full_name}
                    </h4>
                    <p className="font-mono text-xs text-outline">{profile.email || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-low p-2.5">
                    <span className="block font-mono text-[10px] text-outline uppercase">Usia</span>
                    <span className="font-bold text-on-surface">{profile.age ? `${profile.age} thn` : "—"}</span>
                  </div>
                  <div className="rounded-lg bg-surface-low p-2.5">
                    <span className="block font-mono text-[10px] text-outline uppercase">Gender</span>
                    <span className="font-bold text-on-surface">
                      {profile.gender === "female" ? "Perempuan" : "Laki-laki"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface-low p-2.5">
                    <span className="block font-mono text-[10px] text-outline uppercase">Berat Badan</span>
                    <span className="font-bold text-on-surface">{profile.weight ? `${profile.weight} kg` : "—"}</span>
                  </div>
                  <div className="rounded-lg bg-surface-low p-2.5">
                    <span className="block font-mono text-[10px] text-outline uppercase">Tinggi Badan</span>
                    <span className="font-bold text-on-surface">{profile.height ? `${profile.height} cm` : "—"}</span>
                  </div>
                  {bmiInfo && (
                    <div className="rounded-lg bg-surface-low p-2.5 col-span-2">
                      <span className="block font-mono text-[10px] text-outline uppercase">Indeks Massa Tubuh (BMI)</span>
                      <span className="font-bold text-primary font-mono">{bmiInfo} kg/m²</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
                  <div className="flex justify-between">
                    <span className="text-outline">Faktor Aktivitas:</span>
                    <span className="font-semibold text-on-surface">
                      {activityLabels[profile.activity_level || ""] || profile.activity_level || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Orientasi Target:</span>
                    <span className="font-semibold text-on-surface">
                      {goalLabels[profile.goal || ""] || profile.goal || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Target Energi:</span>
                    <span className="font-mono font-bold text-primary">
                      {profile.daily_calorie_target ? `${profile.daily_calorie_target} kkal` : "2000 kkal"}
                    </span>
                  </div>
                </div>

                {/* Catatan Intervensi Gizi */}
                <div className="mt-4 pt-4 border-t border-surface-container flex flex-col gap-2">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-outline">
                    Catatan Klinis Ahli Gizi
                  </label>
                  <textarea
                    rows={4}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Instruksi pola makan khusus pasien..."
                    className="w-full rounded-md border border-surface-high bg-surface-low p-2.5 text-xs text-on-surface outline-none focus:border-primary focus:bg-surface-lowest"
                  />
                  <button
                    onClick={handleSaveCatatan}
                    disabled={savingCatatan}
                    className="self-end cursor-pointer rounded-md bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-high disabled:opacity-50"
                  >
                    {savingCatatan ? "Menyimpan..." : "Simpan Catatan"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-outline py-8">Profil pasien belum lengkap.</p>
            )
          ) : (
            <div className="flex flex-col gap-2.5">
              {foodHistory.length === 0 ? (
                <p className="text-center text-xs text-outline py-8">Belum ada makanan yang dicatat.</p>
              ) : (
                foodHistory.map((m) => (
                  <div key={m.id} className="rounded-lg border border-surface-high bg-surface-lowest p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-on-surface text-xs">{formatFoodLabel(m.food_name)}</span>
                      <span className="font-mono text-xs font-bold text-primary">{m.calories} kkal</span>
                    </div>
                    <span className="block font-mono text-[10px] text-outline mb-2">
                      {formatDateShort(m.recorded_at)}
                    </span>
                    <div className="flex gap-2 font-mono text-[10px] text-on-surface-variant">
                      <span>P: {m.protein || 0}g</span>
                      <span>K: {m.carbs || 0}g</span>
                      <span>L: {m.fat || 0}g</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right: Live Chat ── */}
      <main className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center justify-between border-b border-surface-high bg-surface-lowest px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
            <div>
              <h3 className="font-headline text-[15px] font-bold text-on-surface">
                Konsultasi: {profile?.full_name || "Pasien"}
              </h3>
              <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-outline">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    wsConnected ? "bg-macro-fiber" : "bg-error"
                  }`}
                />
                {wsConnected ? "WebSocket Real-time Aktif" : "Offline"}
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
          {chatMsgs.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-[13px] text-outline">
              <p>Belum ada pesan percakapan dengan pasien ini.</p>
            </div>
          )}

          {chatMsgs.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "nutritionist" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[65%] px-4 py-3 text-[13px] leading-[1.55] ${
                  msg.sender === "nutritionist"
                    ? "rounded-[12px_12px_2px_12px] bg-primary text-on-primary"
                    : "rounded-[12px_12px_12px_2px] border border-surface-high bg-surface-lowest text-on-surface"
                }`}
              >
                <p>{msg.message}</p>
                <div className="mt-1.5 flex items-center justify-end gap-2">
                  <span className="font-mono text-[10px] opacity-65">{formatDateShort(msg.sent_at)}</span>
                  {msg.sender === "nutritionist" && (
                    <button
                      className="flex cursor-pointer items-center p-0.5 text-inherit opacity-55 transition-opacity hover:opacity-100"
                      onClick={() => handleDeleteMsg(msg.id)}
                      title="Hapus pesan"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {consultationStatus === "pending" ? (
          <div className="flex justify-center border-t border-surface-high bg-surface-lowest p-4.5">
            <button
              onClick={handleTangani}
              className="cursor-pointer rounded-md bg-primary px-6 py-2.5 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Ambil Alih & Tangani Pasien
            </button>
          </div>
        ) : (
          <form className="flex gap-2.5 border-t border-surface-high bg-surface-lowest px-5 py-3.5" onSubmit={handleSend}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                consultationStatus === "completed"
                  ? "Sesi konsultasi telah diselesaikan"
                  : "Ketik arahan klinis untuk pasien..."
              }
              className="flex-1 rounded-md border border-outline-variant bg-surface-low px-3.5 py-2.5 text-[13px] text-on-surface outline-none transition-colors focus:border-primary focus:bg-surface-lowest"
              disabled={chatSending || consultationStatus === "completed"}
            />
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-primary px-5 py-2.5 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45"
              disabled={chatSending || !chatInput.trim() || consultationStatus === "completed"}
            >
              {chatSending ? "..." : "Kirim"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
