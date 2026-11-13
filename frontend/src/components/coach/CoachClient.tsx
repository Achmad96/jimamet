"use client";

import { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { useCoachChat } from "@/hooks/useCoachChat";
import {
  CoachSession,
  ChatMessage,
  Consultation,
  formatTime,
  formatRelativeTime,
  quickReplies,
  statusLabels,
} from "@/lib/coach-utils";

interface CoachClientProps {
  initialSessions: CoachSession[];
  initialMessages: ChatMessage[];
  initialConsultations: Consultation[];
}

export function CoachClient({
  initialSessions,
  initialMessages,
  initialConsultations,
}: CoachClientProps) {
  const {
    state,
    activeSession,
    activeConsultation,
    messagesEndRef,
    setInput,
    setConsultationInput,
    setSidebarOpen,
    selectSession,
    handleNewSession,
    handleDeleteSession,
    sendMessage,
    handleShowConsultations,
    selectConsultation,
    handleSendConsultationChat,
    handleKirimKonsultasi,
  } = useCoachChat({
    initialSessions,
    initialMessages,
    initialConsultations,
  });

  const {
    sessions,
    activeSessionId,
    messages,
    isTyping,
    consultations,
    consultationsLoaded,
    activeConsultationId,
    consultationChats,
    consultationSending,
    wsConnected,
    viewMode,
    sidebarOpen,
    input,
    consultationInput,
    konsultasiStatus,
  } = state;

  const handleCoachSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
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
          <h2 className="m-0 mb-3.5 font-headline text-[17px] text-on-surface font-bold tracking-tight">
            NutriCoach AI
          </h2>
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-body text-[13px] font-semibold cursor-pointer transition-colors"
            onClick={handleNewSession}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Sesi Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-7 px-3 text-outline text-xs">Belum ada riwayat sesi AI</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center justify-between px-3 py-2.5 mb-1 rounded-md border cursor-pointer transition-all ${
                  viewMode === "coach" && activeSessionId === s.id
                    ? "bg-surface-lowest border-surface-high shadow-xs"
                    : "border-transparent hover:bg-surface-container"
                }`}
                onClick={() => selectSession(s.id)}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="text-[13px] font-semibold text-on-surface truncate">{s.title}</div>
                  <div className="font-mono text-[11px] text-outline mt-0.5">
                    {formatRelativeTime(s.updated_at)}
                  </div>
                </div>
                <button
                  className="bg-transparent border-none text-outline hover:text-error cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  title="Hapus sesi"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Consultation Section */}
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
              <div className="text-center py-7 px-3 text-outline text-xs">Belum ada tiket konsultasi</div>
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
                      viewMode === "consultation" && activeConsultationId === c.id
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
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {viewMode === "coach" ? (
            <>
              <div className="w-9 h-9 rounded-[8px] bg-primary flex items-center justify-center mr-3 shrink-0">
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="m-0 font-headline text-[15px] font-bold text-on-surface">NutriCoach AI</h2>
                <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Asisten Kontekstual Aktif
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-[8px] bg-macro-fat flex items-center justify-center mr-3 shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h2 className="m-0 font-headline text-[15px] font-bold text-on-surface">
                  {activeConsultation?.handled_by && activeConsultation.status === "pending"
                    ? `Terhubung dengan ${activeConsultation.handled_by}`
                    : "Konsultasi Ahli Gizi"}
                </h2>
                <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-primary" : "bg-error"}`}
                  />
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
            onSubmit={handleCoachSubmit}
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
              <svg
                className="w-[17px] h-[17px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
            {activeConsultation.status === "completed" ? (
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
                  <svg
                    className="w-[17px] h-[17px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
