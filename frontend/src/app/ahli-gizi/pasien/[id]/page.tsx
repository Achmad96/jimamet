"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGetPatientDetails, apiListChat, apiSendChat, apiDeleteChat, apiUpdateConsultation, apiGetMe, getWsConsultationUrl } from "@/lib/api";
import { formatFoodLabel } from "@/lib/food-labels";

interface ChatMsg {
  id: string;
  sender: "user" | "nutritionist";
  message: string;
  sent_at: string;
}

interface PatientProfile {
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

interface FoodRecord {
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
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const activityLabels: Record<string, string> = {
  sedentary: "Sedentari",
  light: "Ringan",
  moderate: "Moderat",
  active: "Aktif",
  veryActive: "Sangat Aktif"
};

const goalLabels: Record<string, string> = {
  lose: "Reduksi Massa",
  maintain: "Pemeliharaan",
  gain: "Surplus Anabolik"
};

export default function ConsultationChatPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [foodHistory, setFoodHistory] = useState<FoodRecord[]>([]);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"profile" | "food">("profile");
  const [consultationStatus, setConsultationStatus] = useState<string>("pending");
  const [catatan, setCatatan] = useState("");
  const [savingCatatan, setSavingCatatan] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load patient details
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { ok, data } = await apiGetPatientDetails(consultationId);
        if (ok) {
          setProfile(data.profile || null);
          setFoodHistory(data.food_history || []);
          if (data.consultation) {
            let st = data.consultation.status || "pending";
            if (data.consultation.handled_by && st === "pending") {
              st = "active";
            }
            setConsultationStatus(st);
            setCatatan(data.consultation.nutritionist_notes || "");
          }
        }
      } catch (e) {
        console.error("Failed to load patient details", e);
      }
      setLoading(false);
    }
    load();
  }, [consultationId]);

  // Load chat history
  const loadChat = useCallback(async () => {
    const { ok, data } = await apiListChat(consultationId);
    if (ok && Array.isArray(data)) {
      setChatMsgs(data);
    }
  }, [consultationId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(getWsConsultationUrl(consultationId));

    ws.onopen = () => {
      console.log("[WS Chat Page] Connected");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
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
              sent_at: data.sent_at
            }
          ];
        });
      }
    };

    ws.onclose = () => {
      console.log("[WS Chat Page] Disconnected");
      setWsConnected(false);
    };
    ws.onerror = () => setWsConnected(false);

    wsRef.current = ws;
  }, [consultationId]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  // Send message
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    setChatSending(true);
    const text = chatInput.trim();
    setChatInput("");

    const { ok, data } = await apiSendChat(consultationId, text, "nutritionist");
    if (ok) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            id: data?.id || `sent-${Date.now()}`,
            message: text,
            sender: "nutritionist",
            sent_at: new Date().toISOString()
          })
        );
      } else {
        setChatMsgs((prev) => [
          ...prev,
          {
            id: data?.id || `local-${Date.now()}`,
            sender: "nutritionist",
            message: text,
            sent_at: new Date().toISOString()
          }
        ]);
      }
    }
    setChatSending(false);
  };

  const handleDeleteMsg = async (chatId: string) => {
    if (!confirm("Hapus pesan ini?")) return;
    const { ok } = await apiDeleteChat(chatId);
    if (ok) await loadChat();
    else alert("Gagal menghapus pesan.");
  };

  const handleSelesai = async () => {
    if (!confirm("Tandai konsultasi ini sebagai selesai?")) return;

    const closingText = "Sesi konsultasi klinis ini telah diselesaikan oleh Ahli Gizi. Terima kasih telah menggunakan layanan NutriCoach.";
    const { ok: chatOk, data } = await apiSendChat(consultationId, closingText, "nutritionist");

    if (chatOk && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          id: data?.id || `sent-${Date.now()}`,
          message: closingText,
          sender: "nutritionist",
          sent_at: new Date().toISOString()
        })
      );
    }

    await apiUpdateConsultation(consultationId, { status: "completed" });
    setConsultationStatus("completed");

    router.push("/ahli-gizi/pasien");
  };

  const handleSaveNotes = async () => {
    setSavingCatatan(true);
    const { ok } = await apiUpdateConsultation(consultationId, { nutritionist_notes: catatan });
    setSavingCatatan(false);
    if (ok) {
      alert("Catatan berhasil disimpan!");
    } else {
      alert("Gagal menyimpan catatan.");
    }
  };

  const handleTangani = async () => {
    let nama = "Ahli Gizi";
    try {
      const { ok, data } = await apiGetMe();
      if (ok) {
        nama = data.full_name || data.username || "Ahli Gizi";
      }
    } catch {}
    await apiUpdateConsultation(consultationId, { handled_by: nama.trim() });

    setConsultationStatus("active");

    const welcomeText = `Halo! Saya Ahli Gizi ${nama.trim()} yang akan membantu Anda hari ini. Ada keluhan atau pertanyaan apa yang bisa saya bantu?`;
    const { ok, data } = await apiSendChat(consultationId, welcomeText, "nutritionist");

    if (ok) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            id: data?.id || `sent-${Date.now()}`,
            message: welcomeText,
            sender: "nutritionist",
            sent_at: new Date().toISOString()
          })
        );
      } else {
        setChatMsgs((prev) => [
          ...prev,
          {
            id: data?.id || `local-${Date.now()}`,
            sender: "nutritionist",
            message: welcomeText,
            sent_at: new Date().toISOString()
          }
        ]);
      }
    }
  };

  // Calculate BMI
  const bmi = profile?.weight && profile?.height ? (profile.weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1) : null;

  // Today's food summary
  const today = new Date().toISOString().split("T")[0];
  const todayFoods = foodHistory.filter((f) => f.recorded_at?.startsWith(today));
  const todayCal = todayFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const todayProtein = todayFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
  const todayCarbs = todayFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const todayFat = todayFoods.reduce((sum, f) => sum + (f.fat || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-outline">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-surface-high border-t-primary" />
        <p className="text-sm">Memuat rekam medis pasien...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-[560px] overflow-hidden rounded-xl border border-surface-high bg-surface-lowest">
      {/* ── Left: Patient Info Panel ── */}
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-surface-high bg-surface-low">
        <div className="border-b border-surface-high bg-surface-lowest p-5">
          <Link href="/ahli-gizi/pasien" className="mb-2 inline-flex items-center gap-1 font-mono text-xs font-medium text-primary hover:underline">
            ← Kembali ke Antrean
          </Link>
          <h2 className="font-headline text-[19px] font-bold tracking-[-0.02em] text-on-surface">{profile?.full_name || "Pasien"}</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">{profile?.email}</p>
        </div>

        <div className="flex border-b border-surface-high bg-surface-lowest">
          <button className={`flex-1 cursor-pointer border-b-2 py-2.5 text-xs font-semibold transition-all ${sidebarTab === "profile" ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-surface"}`} onClick={() => setSidebarTab("profile")}>
            Antropometri
          </button>
          <button className={`flex-1 cursor-pointer border-b-2 py-2.5 text-xs font-semibold transition-all ${sidebarTab === "food" ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-surface"}`} onClick={() => setSidebarTab("food")}>
            Log Konsumsi
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === "profile" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Usia</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{profile?.age ?? "—"} thn</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Berat</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{profile?.weight ?? "—"} kg</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Tinggi</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{profile?.height ?? "—"} cm</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">IMT (BMI)</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{bmi ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Gender</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{profile?.gender === "male" ? "Laki-laki" : profile?.gender === "female" ? "Perempuan" : "—"}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Aktivitas</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{activityLabels[profile?.activity_level || ""] || "—"}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Orientasi</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{goalLabels[profile?.goal || ""] || "—"}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-surface-high bg-surface-lowest p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-outline">Target TDEE</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{profile?.daily_calorie_target ?? "—"} kkal</span>
                </div>
              </div>

              {/* Today's Summary */}
              <div className="rounded-md border border-surface-high bg-surface-lowest p-3.5">
                <h4 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">MONITORING ASUPAN HARI INI</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono text-[15px] font-bold tabular-nums text-primary">{Math.round(todayCal)}</span>
                    <span className="font-mono text-[10px] text-outline">kkal</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono text-[15px] font-bold tabular-nums text-macro-protein">{Math.round(todayProtein)}g</span>
                    <span className="font-mono text-[10px] text-outline">Protein</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono text-[15px] font-bold tabular-nums text-macro-carbs">{Math.round(todayCarbs)}g</span>
                    <span className="font-mono text-[10px] text-outline">Karbo</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono text-[15px] font-bold tabular-nums text-macro-fat">{Math.round(todayFat)}g</span>
                    <span className="font-mono text-[10px] text-outline">Lemak</span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mb-4 flex flex-col gap-2 rounded-md border border-surface-high bg-surface-lowest p-3.5">
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">CATATAN KLINIS AHLI GIZI</h4>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan observasi klinis dan rekomendasi diet pasien..."
                  className="w-full resize-y rounded-sm border border-outline-variant bg-surface-low p-2.5 text-xs leading-[1.5] text-on-surface outline-none transition-colors focus:border-primary"
                  rows={4}
                />
                <button className="cursor-pointer rounded-sm bg-primary px-3 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60" onClick={handleSaveNotes} disabled={savingCatatan}>
                  {savingCatatan ? "Menyimpan..." : "Simpan Catatan Klinis"}
                </button>
              </div>

              {consultationStatus !== "completed" && (
                <button className="w-full cursor-pointer rounded-md border border-outline-variant bg-surface-lowest p-2.5 text-xs font-semibold text-on-surface transition-all hover:border-primary hover:bg-primary/[0.06] hover:text-primary" onClick={handleSelesai}>
                  Selesaikan Sesi Konsultasi
                </button>
              )}
            </div>
          )}

          {sidebarTab === "food" && (
            <div className="flex flex-col">
              {foodHistory.length === 0 ? (
                <p className="py-10 text-center text-xs text-outline">Belum ada rekaman konsumsi pasien.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {foodHistory.map((f) => (
                    <div key={f.id} className="flex items-start gap-2.5 rounded-md border border-surface-high bg-surface-lowest p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-surface-container text-primary">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-on-surface">{formatFoodLabel(f.food_name)}</span>
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          {f.calories} kkal · P {f.protein || 0}g · K {f.carbs || 0}g · L {f.fat || 0}g
                        </span>
                        <span className="font-mono text-[10px] text-outline">{formatDateShort(f.recorded_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right: Chat Area ── */}
      <main className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center justify-between border-b border-surface-high bg-surface-lowest px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
            <div>
              <h3 className="font-headline text-[15px] font-bold text-on-surface">Konsultasi: {profile?.full_name || "Pasien"}</h3>
              <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-outline">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${wsConnected ? "bg-macro-protein" : "bg-error"}`} />
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
            <div key={msg.id} className={`flex ${msg.sender === "nutritionist" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[65%] px-4 py-3 text-[13px] leading-[1.55] ${msg.sender === "nutritionist" ? "rounded-[12px_12px_2px_12px] bg-primary text-on-primary" : "rounded-[12px_12px_12px_2px] border border-surface-high bg-surface-lowest text-on-surface"}`}>
                <p>{msg.message}</p>
                <div className="mt-1.5 flex items-center justify-end gap-2">
                  <span className="font-mono text-[10px] opacity-65">{formatDateShort(msg.sent_at)}</span>
                  {msg.sender === "nutritionist" && (
                    <button className="flex cursor-pointer items-center p-0.5 text-inherit opacity-55 transition-opacity hover:opacity-100" onClick={() => handleDeleteMsg(msg.id)} title="Hapus pesan">
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
            <button onClick={handleTangani} className="cursor-pointer rounded-md bg-primary px-6 py-2.5 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary-container">
              Ambil Alih & Tangani Pasien
            </button>
          </div>
        ) : (
          <form className="flex gap-2.5 border-t border-surface-high bg-surface-lowest px-5 py-3.5" onSubmit={handleSend}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={consultationStatus === "completed" ? "Sesi konsultasi telah diselesaikan" : "Ketik arahan klinis untuk pasien..."}
              className="flex-1 rounded-md border border-outline-variant bg-surface-low px-3.5 py-2.5 text-[13px] text-on-surface outline-none transition-colors focus:border-primary focus:bg-surface-lowest"
              disabled={chatSending || consultationStatus === "completed"}
            />
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-primary px-5 py-2.5 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45"
              disabled={chatSending || !chatInput.trim() || consultationStatus === "completed"}>
              {chatSending ? "..." : "Kirim"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
