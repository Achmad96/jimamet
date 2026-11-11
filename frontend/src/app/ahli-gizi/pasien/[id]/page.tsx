"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./chat.module.css";
import {
  apiGetPatientDetails,
  apiListChat,
  apiSendChat,
  apiDeleteChat,
  apiUpdateConsultation,
  apiGetMe,
  getWsConsultationUrl,
} from "@/lib/api";
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
    minute: "2-digit",
  });
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

    const ws = new WebSocket(
      getWsConsultationUrl(consultationId)
    );

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
              sent_at: data.sent_at,
            },
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
          sent_at: new Date().toISOString(),
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
            sent_at: new Date().toISOString(),
          })
        );
      } else {
        setChatMsgs((prev) => [
          ...prev,
          {
            id: data?.id || `local-${Date.now()}`,
            sender: "nutritionist",
            message: welcomeText,
            sent_at: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  // Calculate BMI
  const bmi =
    profile?.weight && profile?.height
      ? (
          profile.weight /
          ((profile.height / 100) * (profile.height / 100))
        ).toFixed(1)
      : null;

  // Today's food summary
  const today = new Date().toISOString().split("T")[0];
  const todayFoods = foodHistory.filter((f) =>
    f.recorded_at?.startsWith(today)
  );
  const todayCal = todayFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const todayProtein = todayFoods.reduce(
    (sum, f) => sum + (f.protein || 0),
    0
  );
  const todayCarbs = todayFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const todayFat = todayFoods.reduce((sum, f) => sum + (f.fat || 0), 0);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Memuat rekam medis pasien...</p>
      </div>
    );
  }

  return (
    <div className={styles.chatPage}>
      {/* ── Left: Patient Info Panel ── */}
      <aside className={styles.infoPanel}>
        <div className={styles.infoPanelHeader}>
          <Link href="/ahli-gizi/pasien" className={styles.backBtn}>
            ← Kembali ke Antrean
          </Link>
          <h2>{profile?.full_name || "Pasien"}</h2>
          <p className={styles.infoEmail}>{profile?.email}</p>
        </div>

        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${sidebarTab === "profile" ? styles.tabActive : ""}`}
            onClick={() => setSidebarTab("profile")}
          >
            Antropometri
          </button>
          <button
            className={`${styles.tab} ${sidebarTab === "food" ? styles.tabActive : ""}`}
            onClick={() => setSidebarTab("food")}
          >
            Log Konsumsi
          </button>
        </div>

        <div className={styles.infoContent}>
          {sidebarTab === "profile" && (
            <div className={styles.profileSection}>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Usia</span>
                  <span className={styles.profileValue}>{profile?.age ?? "—"} thn</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Berat</span>
                  <span className={styles.profileValue}>{profile?.weight ?? "—"} kg</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Tinggi</span>
                  <span className={styles.profileValue}>{profile?.height ?? "—"} cm</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>IMT (BMI)</span>
                  <span className={styles.profileValue}>{bmi ?? "—"}</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Gender</span>
                  <span className={styles.profileValue}>
                    {profile?.gender === "male" ? "Laki-laki" : profile?.gender === "female" ? "Perempuan" : "—"}
                  </span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Aktivitas</span>
                  <span className={styles.profileValue}>
                    {activityLabels[profile?.activity_level || ""] || "—"}
                  </span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Orientasi</span>
                  <span className={styles.profileValue}>
                    {goalLabels[profile?.goal || ""] || "—"}
                  </span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Target TDEE</span>
                  <span className={styles.profileValue}>
                    {profile?.daily_calorie_target ?? "—"} kkal
                  </span>
                </div>
              </div>

              {/* Today's Summary */}
              <div className={styles.todaySummary}>
                <h4>TELEMETRI ASUPAN HARI INI</h4>
                <div className={styles.nutriGrid}>
                  <div className={styles.nutriItem}>
                    <span className={styles.nutriVal}>{Math.round(todayCal)}</span>
                    <span className={styles.nutriLabel}>kkal</span>
                  </div>
                  <div className={styles.nutriItem}>
                    <span className={styles.nutriVal} style={{ color: "var(--macro-protein)" }}>{Math.round(todayProtein)}g</span>
                    <span className={styles.nutriLabel}>Protein</span>
                  </div>
                  <div className={styles.nutriItem}>
                    <span className={styles.nutriVal} style={{ color: "var(--macro-carbs)" }}>{Math.round(todayCarbs)}g</span>
                    <span className={styles.nutriLabel}>Karbo</span>
                  </div>
                  <div className={styles.nutriItem}>
                    <span className={styles.nutriVal} style={{ color: "var(--macro-fat)" }}>{Math.round(todayFat)}g</span>
                    <span className={styles.nutriLabel}>Lemak</span>
                  </div>
                </div>
              </div>

              <div className={styles.notesSection} style={{ marginBottom: "16px" }}>
                <h4>CATATAN KLINIS AHLI GIZI</h4>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan observasi klinis dan rekomendasi diet pasien..."
                  className={styles.notesInput}
                  rows={4}
                />
                <button 
                  className={styles.saveNotesBtn} 
                  onClick={handleSaveNotes}
                  disabled={savingCatatan}
                >
                  {savingCatatan ? "Menyimpan..." : "Simpan Catatan Klinis"}
                </button>
              </div>

              {consultationStatus !== "completed" && (
                <button className={styles.selesaiBtn} onClick={handleSelesai}>
                  Selesaikan Sesi Konsultasi
                </button>
              )}
            </div>
          )}

          {sidebarTab === "food" && (
            <div className={styles.foodSection}>
              {foodHistory.length === 0 ? (
                <p className={styles.emptyFood}>Belum ada rekaman konsumsi pasien.</p>
              ) : (
                <div className={styles.foodList}>
                  {foodHistory.map((f) => (
                    <div key={f.id} className={styles.foodItem}>
                      <div className={styles.foodIconBox}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>restaurant</span>
                      </div>
                      <div className={styles.foodInfo}>
                        <span className={styles.foodName}>{formatFoodLabel(f.food_name)}</span>
                        <span className={styles.foodMeta}>
                          {f.calories} kkal · P {f.protein || 0}g · K {f.carbs || 0}g · L {f.fat || 0}g
                        </span>
                        <span className={styles.foodDate}>{formatDateShort(f.recorded_at)}</span>
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
      <main className={styles.chatMain}>
        <header className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.chatAvatarBox}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>forum</span>
            </div>
            <div>
              <h3>Konsultasi: {profile?.full_name || "Pasien"}</h3>
              <span className={styles.wsStatus}>
                <span
                  className={
                    wsConnected ? styles.wsDotGreen : styles.wsDotRed
                  }
                />
                {wsConnected ? "WebSocket Real-time Aktif" : "Offline"}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.chatMessages}>
          {chatMsgs.length === 0 && (
            <div className={styles.chatEmpty}>
              <p>Belum ada pesan percakapan dengan pasien ini.</p>
            </div>
          )}

          {chatMsgs.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.msgRow} ${msg.sender === "nutritionist" ? styles.msgRowRight : styles.msgRowLeft}`}
            >
              <div
                className={`${styles.msgBubble} ${msg.sender === "nutritionist" ? styles.msgBubbleRight : styles.msgBubbleLeft}`}
              >
                <p>{msg.message}</p>
                <div className={styles.msgFooter}>
                  <span className={styles.msgTime}>{formatDateShort(msg.sent_at)}</span>
                  {msg.sender === "nutritionist" && (
                    <button
                      className={styles.msgDeleteBtn}
                      onClick={() => handleDeleteMsg(msg.id)}
                      title="Hapus pesan"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {consultationStatus === "pending" ? (
          <div className={styles.chatInputBar} style={{ justifyContent: "center", padding: "18px" }}>
            <button
              onClick={handleTangani}
              className={styles.chatSendBtn}
              style={{ padding: "11px 24px" }}
            >
              Ambil Alih & Tangani Pasien
            </button>
          </div>
        ) : (
          <form className={styles.chatInputBar} onSubmit={handleSend}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={consultationStatus === "completed" ? "Sesi konsultasi telah diselesaikan" : "Ketik arahan klinis untuk pasien..."}
              className={styles.chatInput}
              disabled={chatSending || consultationStatus === "completed"}
            />
            <button
              type="submit"
              className={styles.chatSendBtn}
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
