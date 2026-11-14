import ReactMarkdown from "react-markdown";
import { ChatMessage, formatTime, quickReplies } from "@/lib/coach-utils";

interface CoachAiChatViewProps {
  activeSessionId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  konsultasiStatus: Record<string, "idle" | "loading" | "sent" | "error">;
  onNewSession: () => void;
  onSendMessage: (text: string) => void;
  onKirimKonsultasi: (msgId: string, contextMsgText: string) => void;
}

export function CoachAiChatView({ activeSessionId, messages, isTyping, konsultasiStatus, onNewSession, onSendMessage, onKirimKonsultasi }: CoachAiChatViewProps) {
  const isDraftOrEmpty = !activeSessionId || activeSessionId === "draft" || messages.length === 0;

  return (
    <>
      {isDraftOrEmpty && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center my-auto mx-auto max-w-135 text-on-surface-variant text-center p-6 py-10">
          <div className="w-13 h-13 rounded-xl bg-surface-lowest border border-surface-high text-primary flex items-center justify-center mb-4 shadow-xs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="font-headline text-lg font-bold m-0 mb-1.5 text-on-surface">Mulai Konsultasi NutriCoach AI</h3>
          <p className="text-[13px] max-w-105 leading-relaxed text-on-surface-variant mb-6">
            Diskusikan hasil pemindaian makanan, evaluasi nutrisi, atau tanyakan saran pola makan sehat. Pilih topik cepat di bawah atau langsung ketik pertanyaan Anda.
          </p>

          <span className="block font-mono text-[10px] font-semibold tracking-wider text-primary mb-2 uppercase">TOPIK CEPAT</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickReplies.map((q) => (
              <button
                key={q}
                className="py-2 px-3.5 bg-surface-lowest border border-surface-high hover:border-primary hover:text-primary text-on-surface rounded-md font-body text-xs font-medium cursor-pointer transition-colors shadow-xs"
                onClick={() => onSendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={msg.id || i} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] sm:max-w-[72%] py-3.5 px-4.5 rounded-lg text-sm leading-relaxed ${msg.sender === "user" ? "bg-primary text-on-primary rounded-br-sm" : "bg-surface-lowest text-on-surface rounded-bl-sm border border-surface-high"}`}>
            {msg.sender === "ai" ? (
              <div className="flex flex-col gap-2 wrap-break-word [&_p]:m-0 [&_p]:whitespace-pre-wrap [&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5">
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
            ) : (
              <p className="m-0 whitespace-pre-wrap">{msg.message}</p>
            )}
            <span className="block font-mono text-[10px] mt-2 opacity-65 text-right">{formatTime(msg.sent_at)}</span>

            {msg.needs_consultation && konsultasiStatus[msg.id] !== "sent" && (
              <button
                onClick={() => onKirimKonsultasi(msg.id, msg.message)}
                disabled={konsultasiStatus[msg.id] === "loading"}
                className="mt-3 py-2.5 px-3.5 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-body text-xs font-semibold cursor-pointer w-full transition-colors">
                {konsultasiStatus[msg.id] === "loading" ? "Meneruskan ke Ahli Gizi..." : "Eskalasi ke Ahli Gizi Klinis →"}
              </button>
            )}
            {msg.needs_consultation && konsultasiStatus[msg.id] === "sent" && <div className="mt-2.5 py-2 px-3 rounded-md bg-primary/8 text-xs text-primary font-semibold">Permintaan terkirim — periksa bagian &quot;Konsultasi Ahli Gizi&quot; di sidebar.</div>}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex w-full justify-start">
          <div className="py-3.5 px-4.5 rounded-lg bg-surface-lowest border border-surface-high rounded-bl-sm">
            <div className="flex gap-1.5 py-1 px-0.5">
              <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.32s]" />
              <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.16s]" />
              <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
