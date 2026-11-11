"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiListConsultations, apiUpdateConsultation, apiListChat, apiSendChat, apiDeleteChat, apiDeleteConsultation, getWsConsultationUrl } from "@/lib/api";

interface ChatMsg {
  id: string;
  sender: "user" | "nutritionist";
  message: string;
  sent_at: string;
}

interface Consultation {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  coach_message: string;
  status: "pending" | "completed" | "cancelled";
  nutritionist_notes: string;
  handled_by?: string;
  created_at: string;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const statusStyle = {
  pending:   { bg: "rgba(217, 130, 43, 0.12)", color: "#b36214", label: "Menunggu" },
  completed: { bg: "rgba(20, 54, 37, 0.1)", color: "#143625", label: "Selesai" },
  cancelled: { bg: "var(--surface-container)", color: "var(--outline)", label: "Dibatalkan" },
};

export default function KonsultasiPage() {
  const router = useRouter();
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | "pending" | "completed">("semua");
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Live Chat state (WebSocket)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const loadChatHistory = useCallback(async (kId: string) => {
    const { ok, data } = await apiListChat(kId);
    if (ok && Array.isArray(data)) {
      setChatMsgs(data);
    }
  }, []);

  const connectWebSocket = useCallback((consultationId: string) => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(getWsConsultationUrl(consultationId));

    ws.onopen = () => {
      console.log("[WS Nutritionist] Connected to", consultationId);
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        setChatMsgs((prev) => {
          if (prev.some(m => m.id === data.id && data.id !== "")) return prev;
          return [...prev, {
            id: data.id || `ws-${Date.now()}`,
            consultation_id: consultationId,
            sender: data.sender,
            message: data.message,
            sent_at: data.sent_at,
          }];
        });
      }
    };

    ws.onclose = () => {
      console.log("[WS Nutritionist] Disconnected");
      setWsConnected(false);
    };

    ws.onerror = () => setWsConnected(false);

    wsRef.current = ws;
  }, []);

  // Connect WS when consultation is selected
  useEffect(() => {
    if (selected && selected.status === "pending") {
      loadChatHistory(selected.id);
      connectWebSocket(selected.id);
    } else {
      setChatMsgs([]);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; setWsConnected(false); }
    }
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
  }, [selected, loadChatHistory, connectWebSocket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await apiListConsultations();
    if (ok && Array.isArray(data)) {
      setItems(data);
    } else {
      setError("Gagal memuat data konsultasi.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selected || chatSending) return;
    
    setChatSending(true);
    const text = chatInput.trim();
    setChatInput("");
    
    const { ok, data } = await apiSendChat(selected.id, text, "nutritionist");
    if (ok) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          id: data?.id || `sent-${Date.now()}`,
          message: text,
          sender: "nutritionist",
          sent_at: new Date().toISOString(),
        }));
      } else {
        setChatMsgs((prev) => [...prev, {
          id: data?.id || `local-${Date.now()}`,
          consultation_id: selected.id,
          sender: "nutritionist",
          message: text,
          sent_at: new Date().toISOString(),
        }]);
      }
    }
    setChatSending(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pesan ini?")) return;
    
    const { ok } = await apiDeleteChat(chatId);
    if (ok && selected) {
      await loadChatHistory(selected.id);
    } else {
      alert("Gagal menghapus pesan chat.");
    }
  };

  const handleUpdate = async (status: "completed" | "cancelled") => {
    if (!selected) return;
    setSaving(true);
    const { ok } = await apiUpdateConsultation(selected.id, {
      status,
      nutritionist_notes: catatan,
    });
    if (ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === selected.id
            ? { ...i, status, nutritionist_notes: catatan }
            : i
        )
      );
      setSelected(null);
    }
    setSaving(false);
  };

  const handleDeleteKonsultasi = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus data konsultasi ini beserta seluruh chatnya?")) return;
    
    setLoading(true);
    const { ok } = await apiDeleteConsultation(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selected?.id === id) {
        setSelected(null);
      }
    } else {
      alert("Gagal menghapus konsultasi.");
    }
    setLoading(false);
  };

  const displayed = items.filter((i) =>
    filter === "semua" ? true : i.status === filter
  );

  const countMenunggu = items.filter((i) => i.status === "pending" && !i.handled_by).length;
  const countAktif    = items.filter((i) => i.handled_by).length;
  const countSelesai  = items.filter((i) => i.status === "completed").length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              ANTREAN INTERVENSI GIZI
            </span>
            <h1 className="font-headline text-[26px] font-bold tracking-[-0.03em] text-on-surface">
              Konsultasi Pasien
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Daftar rujukan pasien dari sistem NutriCoach AI yang memerlukan supervisi klinis.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-outline-variant bg-surface-lowest px-4 py-2 text-[13px] font-semibold text-on-surface transition-all hover:bg-surface-low"
          >
            <span className="material-symbols-outlined text-[17px]">refresh</span>
            Muat Ulang
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error-container px-4 py-3 text-[13px] text-error">
          {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="mb-5 grid grid-cols-4 gap-4 max-[900px]:grid-cols-2">
        {[
          { label: "Total Tiket", count: items.length, color: "var(--on-surface)" },
          { label: "Menunggu",    count: countMenunggu, color: "#d9822b" },
          { label: "Ditangani",   count: countAktif,    color: "#2b6f77" },
          { label: "Selesai",     count: countSelesai,  color: "#143625" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl border border-surface-high bg-surface-lowest p-5">
            <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-outline">
              {label}
            </div>
            <div
              className="font-mono text-[30px] font-bold leading-none tabular-nums"
              style={{ color }}
            >
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="mb-4 flex gap-1.5">
        {(["semua", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`cursor-pointer rounded-lg border px-4 py-2 text-[13px] font-semibold transition-all ${
              filter === f
                ? "border-primary bg-primary text-on-primary"
                : "border-surface-high bg-surface-lowest text-on-surface-variant hover:bg-surface-low"
            }`}
          >
            {f === "semua" ? "Semua Tiket" : f === "pending" ? "Menunggu" : "Selesai"}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-sm text-outline">
          <span className="material-symbols-outlined mr-2.5 text-[24px]">hourglass_top</span>
          Memuat antrean konsultasi...
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-12 text-center">
          <span className="material-symbols-outlined mb-2.5 block text-[40px] text-outline-variant">
            inbox
          </span>
          <div className="text-sm text-on-surface-variant">
            {filter === "semua"
              ? "Belum ada pasien yang dirujuk oleh sistem."
              : `Tidak ada konsultasi berstatus "${filter === "pending" ? "Menunggu" : "Selesai"}".`}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-[17px] font-bold tracking-[-0.02em] text-on-surface">
              Daftar Rujukan ({displayed.length})
            </h2>
          </div>
          <div className="flex flex-col">
            {displayed.map((item) => {
              const rawStatus = item.status || "pending";
              let s = statusStyle[rawStatus as keyof typeof statusStyle] || statusStyle.pending;
              if (item.handled_by && rawStatus === "pending") {
                s = { bg: "rgba(43, 111, 119, 0.12)", color: "#2b6f77", label: `Ditangani: ${item.handled_by}` };
              }
              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/ahli-gizi/pasien/${item.id}`)}
                  className="flex cursor-pointer items-start gap-4 rounded-lg border-b border-surface-container px-2 py-4 transition-colors hover:bg-surface-low"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] font-headline text-base font-bold text-primary">
                    {item.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-headline text-sm font-bold text-on-surface">
                        {item.full_name}
                      </span>
                      <span className="font-mono text-[11px] text-outline">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div className="mb-2 truncate text-[13px] leading-normal text-on-surface-variant">
                      {item.coach_message}
                    </div>
                    <span
                      className="inline-block rounded-md px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={(e) => handleDeleteKonsultasi(item.id, e)}
                      title="Hapus Konsultasi"
                      className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-outline transition-colors hover:bg-error-container hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-[18px] text-outline">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-1000 flex items-center justify-center bg-[#141a16]/45"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-[560px] max-w-[90vw] overflow-y-auto rounded-[14px] border border-surface-high bg-surface-lowest p-7 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="mb-1 font-headline text-lg font-bold text-on-surface">
                  Detail Konsultasi
                </h3>
                <p className="text-[13px] text-on-surface-variant">
                  {selected.full_name} · {selected.email}
                </p>
              </div>
              <span
                className="rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold"
                style={{ background: statusStyle[selected.status].bg, color: statusStyle[selected.status].color }}
              >
                {statusStyle[selected.status].label}
              </span>
            </div>

            {/* Pesan CoachBot */}
            <div className="mb-4">
              <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-outline">
                Ringkasan Eskalasi NutriCoach AI
              </div>
              <div className="rounded-[10px] border border-surface-high bg-surface-low p-3.5 text-[13px] leading-[1.6] text-on-surface">
                {selected.coach_message}
              </div>
            </div>

            {/* Waktu */}
            <div className="mb-4 font-mono text-[11px] text-outline">
              Waktu rujukan: {formatDate(selected.created_at)}
            </div>

            {/* Chat Ahli Gizi */}
            {selected.status === "pending" ? (
              <div className="mb-5">
                <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-outline">
                  Kanal Komunikasi Pasien
                </div>
                <div className="flex max-h-[300px] flex-col overflow-hidden rounded-[10px] border border-surface-high">
                  <div className="flex max-h-[200px] flex-1 flex-col gap-2 overflow-y-auto bg-surface p-3">
                    {chatMsgs.length === 0 ? (
                      <div className="p-5 text-center text-xs text-outline">
                        Belum ada pesan percakapan.
                      </div>
                    ) : (
                      chatMsgs.map((m) => (
                        <div
                          key={m.id}
                          className={`relative flex flex-col ${
                            m.sender === "nutritionist" ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 ${
                              m.sender === "nutritionist" ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <div
                              className={`max-w-full px-3 py-2 text-[13px] leading-[1.5] ${
                                m.sender === "nutritionist"
                                  ? "rounded-[10px_10px_2px_10px] bg-primary text-on-primary"
                                  : "rounded-[10px_10px_10px_2px] border border-surface-high bg-surface-lowest text-on-surface"
                              }`}
                            >
                              {m.sender === "user" && (
                                <div className="mb-0.5 font-mono text-[10px] font-semibold text-outline">
                                  PASIEN
                                </div>
                              )}
                              {m.message}
                            </div>
                            
                            <button
                              onClick={() => handleDeleteChat(m.id)}
                              title="Hapus pesan"
                              className="flex cursor-pointer items-center justify-center p-1 text-error opacity-60 transition-opacity hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                          
                          <span className="mt-0.5 font-mono text-[10px] text-outline">
                            {formatDate(m.sent_at).split(" ")[1]}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form
                    onSubmit={handleSendChat}
                    className="flex gap-2 border-t border-surface-high bg-surface-lowest px-3 py-2.5"
                  >
                    <input
                      type="text"
                      placeholder="Balas pesan pasien..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatSending}
                      className="flex-1 rounded-lg border border-surface-high bg-surface-low px-3 py-2 text-[13px] outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatSending}
                      className={`rounded-lg px-4 text-[13px] font-semibold text-white transition-colors ${
                        chatInput.trim()
                          ? "cursor-pointer bg-primary hover:bg-primary-container"
                          : "cursor-default bg-surface-highest"
                      }`}
                    >
                      Kirim
                    </button>
                  </form>
                </div>
              </div>
            ) : selected.nutritionist_notes ? (
              <div className="mb-5">
                <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-outline">
                  Catatan Klinis Ahli Gizi
                </div>
                <div className="rounded-lg bg-surface-low p-3 text-[13px] leading-[1.6] text-on-surface">
                  {selected.nutritionist_notes}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex justify-end gap-2.5">
              <button
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-outline-variant bg-surface-lowest px-4 py-2 text-[13px] font-semibold text-on-surface transition-all hover:bg-surface-low"
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                Tutup
              </button>
              {selected.status === "pending" && (
                <>
                  <button
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-error/25 bg-error-container px-4 py-2 text-[13px] font-semibold text-error transition-all hover:bg-error hover:text-white"
                    onClick={() => handleUpdate("cancelled")}
                    disabled={saving}
                  >
                    Batalkan
                  </button>
                  <button
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary transition-all hover:bg-primary-container"
                    onClick={() => handleUpdate("completed")}
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Tandai Selesai"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
