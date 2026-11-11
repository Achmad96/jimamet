"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../ahli-gizi.module.css";
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
      // Broadcast via WebSocket
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
    e.stopPropagation(); // Mencegah membuka detail saat tombol hapus diklik
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
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <span className={styles.headerKicker}>ANTREAN INTERVENSI GIZI</span>
            <h1>Konsultasi Pasien</h1>
            <p>Daftar rujukan pasien dari sistem NutriCoach AI yang memerlukan supervisi klinis.</p>
          </div>
          <button
            onClick={fetchData}
            className={styles.btnSecondary}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>refresh</span>
            Muat Ulang
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--error-container)", color: "var(--error)", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Tiket", count: items.length, color: "var(--on-surface)" },
          { label: "Menunggu",    count: countMenunggu, color: "#d9822b" },
          { label: "Ditangani",   count: countAktif,    color: "#2b6f77" },
          { label: "Selesai",     count: countSelesai,  color: "#143625" },
        ].map(({ label, count, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statLabel}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["semua", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === f ? "1px solid var(--primary)" : "1px solid var(--surface-container-high)",
              background: filter === f ? "var(--primary)" : "var(--surface-container-lowest)",
              color: filter === f ? "var(--on-primary)" : "var(--on-surface-variant)",
              transition: "all 0.15s",
            }}
          >
            {f === "semua" ? "Semua Tiket" : f === "pending" ? "Menunggu" : "Selesai"}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className={styles.loading}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, marginRight: 10 }}>hourglass_top</span>
          Memuat antrean konsultasi...
        </div>
      ) : displayed.length === 0 ? (
        <div className={styles.card} style={{ textAlign: "center", padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--outline-variant)", display: "block", marginBottom: 10 }}>
            inbox
          </span>
          <div style={{ color: "var(--on-surface-variant)", fontSize: 14 }}>
            {filter === "semua"
              ? "Belum ada pasien yang dirujuk oleh sistem."
              : `Tidak ada konsultasi berstatus "${filter === "pending" ? "Menunggu" : "Selesai"}".`}
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.sectionHeader} style={{ marginBottom: 12 }}>
            <h2>Daftar Rujukan ({displayed.length})</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 16,
                    padding: "16px 8px", borderBottom: "1px solid var(--surface-container)",
                    cursor: "pointer", transition: "background 0.15s", borderRadius: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: "rgba(20, 54, 37, 0.08)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: "var(--primary)",
                    fontFamily: "var(--font-headline)",
                  }}>
                    {item.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--on-surface)", fontFamily: "var(--font-headline)" }}>
                        {item.full_name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--outline)" }}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 8, lineHeight: 1.5,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.coach_message}
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                      {s.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={(e) => handleDeleteKonsultasi(item.id, e)}
                      title="Hapus Konsultasi"
                      style={{
                        background: "transparent", border: "none", color: "var(--outline)", cursor: "pointer",
                        padding: 6, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 6, transition: "color 0.15s, background 0.15s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--error-container)";
                        e.currentTarget.style.color = "var(--error)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--outline)";
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--outline)" }}>
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
          style={{ position: "fixed", inset: 0, background: "rgba(20, 26, 22, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)", borderRadius: 14, padding: 28, width: 560, maxWidth: "90vw", boxShadow: "var(--shadow-lg)", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-headline)", fontSize: 18, fontWeight: 700, color: "var(--on-surface)", margin: "0 0 4px" }}>
                  Detail Konsultasi
                </h3>
                <p style={{ fontSize: 13, color: "var(--on-surface-variant)", margin: 0 }}>
                  {selected.full_name} · {selected.email}
                </p>
              </div>
              <span style={{ background: statusStyle[selected.status].bg, color: statusStyle[selected.status].color, padding: "4px 10px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                {statusStyle[selected.status].label}
              </span>
            </div>

            {/* Pesan CoachBot */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--outline)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Ringkasan Eskalasi NutriCoach AI
              </div>
              <div style={{ background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)", borderRadius: 10, padding: 14, fontSize: 13, color: "var(--on-surface)", lineHeight: 1.6 }}>
                {selected.coach_message}
              </div>
            </div>

            {/* Waktu */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--outline)", marginBottom: 16 }}>
              Waktu rujukan: {formatDate(selected.created_at)}
            </div>

            {/* Chat Ahli Gizi */}
            {selected.status === "pending" ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--outline)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Kanal Komunikasi Pasien
                </div>
                <div style={{
                  border: "1px solid var(--surface-container-high)",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: 300,
                  overflow: "hidden"
                }}>
                  <div style={{
                    flex: 1, overflowY: "auto", padding: 12, background: "var(--surface)",
                    display: "flex", flexDirection: "column", gap: 8, maxHeight: 200
                  }}>
                    {chatMsgs.length === 0 ? (
                      <div style={{ textAlign: "center", fontSize: 12, color: "var(--outline)", padding: 20 }}>
                        Belum ada pesan percakapan.
                      </div>
                    ) : (
                      chatMsgs.map((m) => (
                        <div key={m.id} style={{
                          display: "flex", flexDirection: "column",
                          alignItems: m.sender === "nutritionist" ? "flex-end" : "flex-start",
                          position: "relative"
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            flexDirection: m.sender === "nutritionist" ? "row-reverse" : "row"
                          }}>
                            <div style={{
                              maxWidth: "100%", padding: "8px 12px",
                              borderRadius: m.sender === "nutritionist" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                              background: m.sender === "nutritionist" ? "var(--primary)" : "var(--surface-container-lowest)",
                              color: m.sender === "nutritionist" ? "var(--on-primary)" : "var(--on-surface)",
                              border: m.sender === "user" ? "1px solid var(--surface-container-high)" : "none",
                              fontSize: 13, lineHeight: 1.5
                            }}>
                              {m.sender === "user" && (
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--outline)", marginBottom: 3 }}>
                                  PASIEN
                                </div>
                              )}
                              {m.message}
                            </div>
                            
                            <button
                              onClick={() => handleDeleteChat(m.id)}
                              title="Hapus pesan"
                              style={{
                                background: "transparent", border: "none", color: "var(--error)", cursor: "pointer",
                                padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: 0.6, transition: "opacity 0.2s"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          </div>
                          
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--outline)", marginTop: 2 }}>{formatDate(m.sent_at).split(' ')[1]}</span>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleSendChat} style={{
                    display: "flex", gap: 8, padding: "10px 12px", background: "var(--surface-container-lowest)", borderTop: "1px solid var(--surface-container-high)"
                  }}>
                    <input
                      type="text"
                      placeholder="Balas pesan pasien..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatSending}
                      style={{
                        flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid var(--surface-container-high)",
                        borderRadius: 8, outline: "none", fontFamily: "inherit", background: "var(--surface-container-low)"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatSending}
                      style={{
                        padding: "0 16px", borderRadius: 8, border: "none",
                        background: chatInput.trim() ? "var(--primary)" : "var(--surface-container-highest)",
                        color: "#fff", cursor: chatInput.trim() ? "pointer" : "default",
                        fontSize: 13, fontWeight: 600, transition: "background 0.15s"
                      }}
                    >
                      Kirim
                    </button>
                  </form>
                </div>
              </div>
            ) : selected.nutritionist_notes ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--outline)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Catatan Klinis Ahli Gizi
                </div>
                <div style={{ background: "var(--surface-container-low)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--on-surface)", lineHeight: 1.6 }}>
                  {selected.nutritionist_notes}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.btnSecondary} onClick={() => setSelected(null)} disabled={saving}>Tutup</button>
              {selected.status === "pending" && (
                <>
                  <button className={styles.btnReject} onClick={() => handleUpdate("cancelled")} disabled={saving}>
                    Batalkan
                  </button>
                  <button className={styles.btnPrimary} onClick={() => handleUpdate("completed")} disabled={saving}>
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
