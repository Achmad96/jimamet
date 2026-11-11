"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import {
  apiListCoachSessions,
  apiGetCoachSession,
  apiCreateCoachSession,
  apiDeleteCoachSession,
  apiSendCoachMessage,
  apiCreateConsultation,
  apiSendChat,
  apiListConsultations,
  apiListChat,
  getWsConsultationUrl,
} from "@/lib/api";

interface CoachSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender: "user" | "ai";
  message: string;
  needs_consultation: boolean;
  sent_at: string;
}

interface Consultation {
  id: string;
  user_id: string;
  coach_message: string;
  status: "pending" | "completed" | "cancelled";
  handled_by?: string;
  created_at: string;
}

interface ConsultationChat {
  id: string;
  consultation_id: string;
  sender: "user" | "nutritionist";
  message: string;
  sent_at: string;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatRelativeTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) return `${diffMins || 1}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return "Kemarin";
    return `${diffDays}h lalu`;
  } catch {
    return "";
  }
}

const quickReplies = [
  "Evaluasi rasio makronutrisi hari ini",
  "Rekomendasi menu makan malam tinggi protein",
  "Strategi defisit kalori berkelanjutan",
  "Saya memiliki keluhan pencernaan / klinis",
];

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "#d9822b" },
  completed: { label: "Selesai", color: "#143625" },
  cancelled: { label: "Dibatalkan", color: "#6f7771" },
};

type ViewMode = "coach" | "consultation";

export default function NutriCoachPage() {
  // Coach AI state
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Consultation state
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationsLoaded, setConsultationsLoaded] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<string | null>(null);
  const [consultationChats, setConsultationChats] = useState<ConsultationChat[]>([]);
  const [consultationInput, setConsultationInput] = useState("");
  const [consultationSending, setConsultationSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Shared state
  const [viewMode, setViewMode] = useState<ViewMode>("coach");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [konsultasiStatus, setKonsultasiStatus] = useState<Record<string, "idle" | "loading" | "sent" | "error">>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadSessions();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, consultationChats]);

  // ── Coach Sessions ──
  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { ok, data } = await apiListCoachSessions();
      if (ok && Array.isArray(data)) {
        setSessions(data);
        if (data.length > 0 && !activeSession) {
          selectSession(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    setViewMode("coach");
    setActiveSession(sessionId);
    setActiveConsultation(null);
    setSidebarOpen(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    }
    try {
      const { ok, data } = await apiGetCoachSession(sessionId);
      if (ok) {
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewSession = async () => {
    try {
      const { ok, data } = await apiCreateCoachSession("Sesi Konsultasi Baru");
      if (ok && data) {
        setSessions([data, ...sessions]);
        setActiveSession(data.id);
        setActiveConsultation(null);
        setViewMode("coach");
        setMessages([]);
        setSidebarOpen(false);
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
          setWsConnected(false);
        }
      } else {
        alert(data?.error || "Gagal membuat sesi baru. Periksa backend.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Hapus sesi konsultasi ini?")) return;
    try {
      const { ok } = await apiDeleteCoachSession(sessionId);
      if (ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        if (activeSession === sessionId) {
          setActiveSession(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Coach Chat ──
  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeSession) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: activeSession,
      sender: "user",
      message: text,
      needs_consultation: false,
      sent_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await apiSendCoachMessage(activeSession, text);
      if (res.ok) {
        const aiMsg: ChatMessage = {
          id: `temp-ai-${Date.now()}`,
          session_id: activeSession,
          sender: "ai",
          message: res.data.reply,
          needs_consultation: res.data.needs_consultation,
          sent_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (res.data.session) {
          setSessions((prev) => prev.map((s) => (s.id === activeSession ? res.data.session : s)));
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-err-${Date.now()}`,
            session_id: activeSession,
            sender: "ai",
            message: "Maaf, sistem AI sedang mengalami kendala. Silakan coba beberapa saat lagi.",
            needs_consultation: false,
            sent_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKirimKonsultasi = async (msgId: string, contextMsgText: string) => {
    setKonsultasiStatus((prev) => ({ ...prev, [msgId]: "loading" }));
    const pesanCoachbot = `Pasien membutuhkan konsultasi terkait riwayat percakapan. Sistem NutriCoach AI menyarankan penanganan langsung dari ahli gizi untuk kondisi ini. Konteks: "${contextMsgText.substring(0, 50)}..."`;

    try {
      const { ok, data } = await apiCreateConsultation(pesanCoachbot);
      if (ok && data?.id) {
        await apiSendChat(data.id, "Halo Ahli Gizi, saya diarahkan oleh NutriCoach AI untuk berkonsultasi.", "user");

        setKonsultasiStatus((prev) => ({ ...prev, [msgId]: "sent" }));

        const closingMsg: ChatMessage = {
          id: `closing-${Date.now()}`,
          session_id: activeSession || "",
          sender: "ai",
          message:
            'Permintaan konsultasi klinis Anda telah diteruskan ke **Ahli Gizi**.\n\nSilakan buka panel **"Konsultasi Ahli Gizi"** di sidebar kiri untuk melanjutkan diskusi secara langsung.',
          needs_consultation: false,
          sent_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, closingMsg]);

        await loadConsultations();

        setTimeout(async () => {
          if (activeSession) {
            const sessionId = activeSession;
            setActiveSession(null);
            setMessages([]);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            await apiDeleteCoachSession(sessionId);
          }
        }, 3000);
      } else {
        throw new Error("Failed to create consultation");
      }
    } catch {
      setKonsultasiStatus((prev) => ({ ...prev, [msgId]: "error" }));
      alert("Gagal mengirim permintaan konsultasi.");
    }
  };

  // ── Consultations (WebSocket real-time) ──
  const loadConsultations = async () => {
    try {
      const { ok, data } = await apiListConsultations();
      if (ok && Array.isArray(data)) {
        setConsultations(data);
        setConsultationsLoaded(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShowConsultations = async () => {
    if (!consultationsLoaded) {
      await loadConsultations();
    }
  };

  const connectWebSocket = (consultationId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = getWsConsultationUrl(consultationId);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        const newMsg: ConsultationChat = {
          id: data.id || `ws-${Date.now()}`,
          consultation_id: consultationId,
          sender: data.sender,
          message: data.message,
          sent_at: data.sent_at,
        };
        setConsultationChats((prev) => {
          if (prev.some((m) => m.id === newMsg.id && newMsg.id !== "")) return prev;
          return [...prev, newMsg];
        });

        apiListConsultations().then(({ ok, data }) => {
          if (ok && Array.isArray(data)) {
            setConsultations(data);
          }
        });
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    wsRef.current = ws;
  };

  const selectConsultation = async (consultationId: string) => {
    setViewMode("consultation");
    setActiveConsultation(consultationId);
    setActiveSession(null);
    setSidebarOpen(false);

    try {
      const { ok, data } = await apiListChat(consultationId);
      if (ok && Array.isArray(data)) {
        setConsultationChats(data);
      }
    } catch (e) {
      console.error(e);
    }

    connectWebSocket(consultationId);
  };

  const handleSendConsultationChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!consultationInput.trim() || !activeConsultation || consultationSending) return;

    setConsultationSending(true);
    const text = consultationInput.trim();
    setConsultationInput("");

    try {
      const { ok, data } = await apiSendChat(activeConsultation, text, "user");
      if (ok) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              id: data?.id || `sent-${Date.now()}`,
              message: text,
              sender: "user",
              sent_at: new Date().toISOString(),
            })
          );
        } else {
          setConsultationChats((prev) => [
            ...prev,
            {
              id: data?.id || `local-${Date.now()}`,
              consultation_id: activeConsultation,
              sender: "user",
              message: text,
              sent_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConsultationSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-116px)] bg-surface-lowest border border-surface-high rounded-lg overflow-hidden relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-on-surface/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[280px] bg-surface-low border-r border-surface-high flex flex-col transition-transform duration-200 z-30 absolute md:static inset-y-0 left-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 pt-5 border-b border-surface-high">
          <span className="block font-mono text-[10px] font-semibold tracking-wider text-outline mb-1">
            ASISTEN DIETETIKA
          </span>
          <h2 className="m-0 mb-3.5 font-headline text-[17px] text-on-surface font-bold tracking-tight">
            NutriCoach AI
          </h2>
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-body text-[13px] font-semibold cursor-pointer transition-colors"
            onClick={handleNewSession}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Sesi Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-7 px-3 text-outline text-xs">
              Belum ada riwayat sesi AI
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center justify-between px-3 py-2.5 mb-1 rounded-md border cursor-pointer transition-all ${
                  viewMode === "coach" && activeSession === s.id
                    ? "bg-surface-lowest border-surface-high shadow-xs"
                    : "border-transparent hover:bg-surface-container"
                }`}
                onClick={() => selectSession(s.id)}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="text-[13px] font-semibold text-on-surface truncate">
                    {s.title}
                  </div>
                  <div className="font-mono text-[11px] text-outline mt-0.5">
                    {formatRelativeTime(s.updated_at)}
                  </div>
                </div>
                <button
                  className="bg-transparent border-none text-outline hover:text-error cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  title="Hapus sesi"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Consultation Section — lazy loaded */}
        <div
          className="px-4 pt-3 pb-2 border-t border-surface-high mt-1 cursor-pointer"
          onClick={handleShowConsultations}
        >
          <span className="font-mono text-[10px] font-semibold text-primary uppercase tracking-wider">
            Konsultasi Ahli Gizi {!consultationsLoaded && "· Muat"}
          </span>
        </div>
        {consultationsLoaded && (
          <div className="flex-1 overflow-y-auto p-2">
            {consultations.length === 0 ? (
              <div className="text-center py-7 px-3 text-outline text-xs">
                Belum ada tiket konsultasi
              </div>
            ) : (
              consultations.map((c) => {
                const rawStatus = c.status || "pending";
                let st = statusLabels[rawStatus] || statusLabels.pending;

                if (c.handled_by && rawStatus === "pending") {
                  st = { label: `Ditangani ${c.handled_by}`, color: "#2b6f77" };
                }

                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between px-3 py-2.5 mb-1 rounded-md border cursor-pointer transition-all ${
                      viewMode === "consultation" && activeConsultation === c.id
                        ? "bg-surface-lowest border-surface-high shadow-xs"
                        : "border-transparent hover:bg-surface-container"
                    }`}
                    onClick={() => selectConsultation(c.id)}
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[13px] font-semibold text-on-surface truncate">
                        Konsultasi Klinis
                      </div>
                      <div className="font-mono text-[11px] text-outline mt-0.5">
                        <span className="font-semibold" style={{ color: st.color }}>
                          ● {st.label}
                        </span>
                        {" · "}
                        {formatRelativeTime(c.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-surface min-w-0">
        <header className="flex items-center px-6 py-3.5 bg-surface-lowest border-b border-surface-high">
          <button
            className="block md:hidden bg-transparent border-none cursor-pointer p-1.5 mr-2 text-on-surface"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {viewMode === "coach" ? (
            <>
              <div className="w-9 h-9 rounded-[8px] bg-primary flex items-center justify-center mr-3 shrink-0">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="m-0 font-headline text-[15px] font-bold text-on-surface">
                  NutriCoach AI
                </h2>
                <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Asisten Kontekstual Aktif
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-[8px] bg-macro-fat flex items-center justify-center mr-3 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h2 className="m-0 font-headline text-[15px] font-bold text-on-surface">
                  {(() => {
                    if (activeConsultation) {
                      const c = consultations.find((c) => c.id === activeConsultation);
                      if (c?.handled_by && c.status === "pending") return `Terhubung dengan ${c.handled_by}`;
                    }
                    return "Konsultasi Ahli Gizi";
                  })()}
                </h2>
                <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-primary" : "bg-error"}`} />
                  {wsConnected ? "Kanal Real-time" : "Terputus"}
                </span>
              </div>
              <div
                className={`ml-auto px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold whitespace-nowrap ${
                  wsConnected ? "bg-primary/8 text-primary" : "bg-error/8 text-error"
                }`}
              >
                ● {wsConnected ? "WebSocket Aktif" : "WebSocket Terputus"}
              </div>
            </>
          )}
        </header>

        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3.5">
          {/* ── COACH AI VIEW ── */}
          {viewMode === "coach" && (
            <>
              {!activeSession ? (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center p-6">
                  <div className="w-13 h-13 rounded-lg bg-surface-lowest border border-surface-high text-primary flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-headline text-lg font-bold m-0 mb-1.5 text-on-surface">
                    Mulai Konsultasi NutriCoach AI
                  </h3>
                  <p className="text-[13px] max-w-[360px] leading-relaxed">
                    Diskusikan hasil pemindaian nutrisi, target kalori, atau keluhan dietetika Anda.
                  </p>
                  <button
                    className="mt-4 py-2.5 px-5 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md text-[13px] font-semibold cursor-pointer transition-colors"
                    onClick={handleNewSession}
                  >
                    Buat Sesi Konsultasi
                  </button>
                </div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-center my-4 mx-auto max-w-[540px] text-on-surface-variant text-[13px]">
                      <span className="block font-mono text-[10px] font-semibold tracking-wider text-primary mb-1.5">
                        TOPIK CEPAT
                      </span>
                      <p>Pilih topik diskusi di bawah atau ketik pertanyaan spesifik Anda:</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-3.5">
                        {quickReplies.map((q) => (
                          <button
                            key={q}
                            className="py-2 px-3.5 bg-surface-lowest border border-surface-high hover:border-primary hover:text-primary text-on-surface rounded-md font-body text-xs font-medium cursor-pointer transition-colors"
                            onClick={() => sendMessage(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[72%] py-3.5 px-4.5 rounded-lg text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-primary text-on-primary rounded-br-[4px]"
                            : "bg-surface-lowest text-on-surface rounded-bl-[4px] border border-surface-high"
                        }`}
                      >
                        {msg.sender === "ai" ? (
                          <div className="flex flex-col gap-2 break-words [&_p]:m-0 [&_p]:whitespace-pre-wrap [&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5">
                            <ReactMarkdown>{msg.message}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="m-0 whitespace-pre-wrap">{msg.message}</p>
                        )}
                        <span className="block font-mono text-[10px] mt-2 opacity-65 text-right">
                          {formatTime(msg.sent_at)}
                        </span>

                        {msg.needs_consultation && konsultasiStatus[msg.id] !== "sent" && (
                          <button
                            onClick={() => handleKirimKonsultasi(msg.id, msg.message)}
                            disabled={konsultasiStatus[msg.id] === "loading"}
                            className="mt-3 py-2.5 px-3.5 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-body text-xs font-semibold cursor-pointer w-full transition-colors"
                          >
                            {konsultasiStatus[msg.id] === "loading"
                              ? "Meneruskan ke Ahli Gizi..."
                              : "Eskalasi ke Ahli Gizi Klinis →"}
                          </button>
                        )}
                        {msg.needs_consultation && konsultasiStatus[msg.id] === "sent" && (
                          <div className="mt-2.5 py-2 px-3 rounded-[6px] bg-primary/8 text-xs text-primary font-semibold">
                            Permintaan terkirim — periksa bagian &quot;Konsultasi Ahli Gizi&quot; di sidebar.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex w-full justify-start">
                      <div className="py-3.5 px-4.5 rounded-lg bg-surface-lowest border border-surface-high rounded-bl-[4px]">
                        <div className="flex gap-1.5 py-1 px-0.5">
                          <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.32s]" />
                          <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.16s]" />
                          <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── CONSULTATION VIEW ── */}
          {viewMode === "consultation" && (
            <>
              {!activeConsultation ? (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center p-6">
                  <div className="w-13 h-13 rounded-lg bg-surface-lowest border border-surface-high text-primary flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <h3 className="font-headline text-lg font-bold m-0 mb-1.5 text-on-surface">
                    Konsultasi Ahli Gizi
                  </h3>
                  <p className="text-[13px] max-w-[360px] leading-relaxed">
                    Pilih sesi konsultasi di sidebar kiri untuk membuka riwayat pesan klinis.
                  </p>
                </div>
              ) : (
                <>
                  {consultationChats.length === 0 && (
                    <div className="text-center my-4 mx-auto max-w-[540px] text-on-surface-variant text-[13px]">
                      <p>Menunggu respons dari Ahli Gizi yang bertugas...</p>
                      <p className="text-xs text-outline mt-1.5">
                        Pesan disinkronisasikan secara langsung melalui WebSocket.
                      </p>
                    </div>
                  )}

                  {consultationChats.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[72%] py-3.5 px-4.5 rounded-lg text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-primary text-on-primary rounded-br-[4px]"
                            : "bg-surface-lowest text-on-surface rounded-bl-[4px] border border-surface-high border-l-3 border-l-macro-fat"
                        }`}
                      >
                        {msg.sender === "nutritionist" && (
                          <div className="font-mono text-[10px] font-semibold tracking-wider text-macro-fat mb-1.5">
                            AHLI GIZI KLINIS
                          </div>
                        )}
                        <p className="m-0 whitespace-pre-wrap">{msg.message}</p>
                        <span className="block font-mono text-[10px] mt-2 opacity-65 text-right">
                          {formatTime(msg.sent_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {viewMode === "coach" && activeSession && (
          <form
            onSubmit={handleSubmit}
            className="flex px-6 py-3.5 bg-surface-lowest border-t border-surface-high gap-2.5"
          >
            <input
              type="text"
              placeholder="Tanyakan analisis gizi atau rencana diet..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 py-2.5 px-4 border border-surface-high rounded-md bg-surface-low font-body text-sm text-on-surface outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-3 focus:ring-primary/10"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="w-[42px] h-[42px] rounded-md bg-primary hover:bg-primary-container text-on-primary border-none flex items-center justify-center cursor-pointer transition-colors shrink-0 disabled:bg-surface-highest disabled:text-outline disabled:cursor-not-allowed"
              disabled={!input.trim() || isTyping}
            >
              <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        )}

        {viewMode === "consultation" && activeConsultation && (
          <form
            onSubmit={handleSendConsultationChat}
            className="flex px-6 py-3.5 bg-surface-lowest border-t border-surface-high gap-2.5"
          >
            {consultations.find((c) => c.id === activeConsultation)?.status === "completed" ? (
              <div className="w-full py-2.5 px-3.5 text-center text-on-surface-variant text-[13px] bg-surface-low border border-surface-high rounded-md">
                Sesi konsultasi ini telah diselesaikan oleh Ahli Gizi.
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Ketik balasan untuk Ahli Gizi..."
                  value={consultationInput}
                  onChange={(e) => setConsultationInput(e.target.value)}
                  className="flex-1 py-2.5 px-4 border border-surface-high rounded-md bg-surface-low font-body text-sm text-on-surface outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-3 focus:ring-primary/10"
                  disabled={consultationSending}
                />
                <button
                  type="submit"
                  className="w-[42px] h-[42px] rounded-md bg-primary hover:bg-primary-container text-on-primary border-none flex items-center justify-center cursor-pointer transition-colors shrink-0 disabled:bg-surface-highest disabled:text-outline disabled:cursor-not-allowed"
                  disabled={!consultationInput.trim() || consultationSending}
                >
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
