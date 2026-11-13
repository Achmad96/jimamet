"use client";

import { useState, useEffect, useCallback, useMemo, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiListChat, apiSendChat, apiDeleteChat, apiUpdateConsultation, apiGetMe, getWsConsultationUrl } from "@/lib/api";
import { PatientDetailHeader } from "./PatientDetailHeader";
import { PatientProfileSidebar } from "./PatientProfileSidebar";
import { PatientFoodLogSidebar } from "./PatientFoodLogSidebar";
import { PatientChatArea } from "./PatientChatArea";

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
      minute: "2-digit"
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
  veryActive: "Sangat Aktif"
};

const goalLabels: Record<string, string> = {
  lose: "Reduksi Massa",
  maintain: "Pemeliharaan",
  gain: "Surplus Anabolik"
};

interface PatientDetailClientProps {
  consultationId: string;
  initialProfile: PatientProfile | null;
  initialFoodHistory: FoodRecord[];
  initialStatus: string;
  initialCatatan: string;
  initialChat: ChatMsg[];
}

export function PatientDetailClient({ consultationId, initialProfile, initialFoodHistory, initialStatus, initialCatatan, initialChat }: PatientDetailClientProps) {
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
                sent_at: data.sent_at || new Date().toISOString()
              }
            ];
          });
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    wsRef.current = ws;
  }, [consultationId]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
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
      nutritionist_notes: catatan
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
      handled_by: nutritionistName
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
      nutritionist_notes: catatan
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
        <PatientDetailHeader consultationStatus={consultationStatus} onComplete={handleComplete} />

        {/* Tab Toggle */}
        <div className="flex border-b border-surface-container bg-surface-low">
          <button onClick={() => setSidebarTab("profile")} className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${sidebarTab === "profile" ? "border-b-2 border-primary bg-surface-lowest text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
            Profil Pasien
          </button>
          <button onClick={() => setSidebarTab("food")} className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${sidebarTab === "food" ? "border-b-2 border-primary bg-surface-lowest text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
            Log Makanan ({foodHistory.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {sidebarTab === "profile" ? (
            <PatientProfileSidebar profile={profile} bmiInfo={bmiInfo} catatan={catatan} savingCatatan={savingCatatan} activityLabels={activityLabels} goalLabels={goalLabels} onCatatanChange={setCatatan} onSaveCatatan={handleSaveCatatan} />
          ) : (
            <PatientFoodLogSidebar foodHistory={foodHistory} formatDateShort={formatDateShort} />
          )}
        </div>
      </aside>

      {/* ── Right: Live Chat ── */}
      <PatientChatArea
        patientName={profile?.full_name || "Pasien"}
        wsConnected={wsConnected}
        chatMsgs={chatMsgs}
        chatInput={chatInput}
        chatSending={chatSending}
        consultationStatus={consultationStatus}
        chatEndRef={chatEndRef}
        formatDateShort={formatDateShort}
        onChatInputChange={setChatInput}
        onDeleteMsg={handleDeleteMsg}
        onTangani={handleTangani}
        onSend={handleSend}
      />
    </div>
  );
}
