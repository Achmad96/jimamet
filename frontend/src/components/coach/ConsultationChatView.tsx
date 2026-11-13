import { ConsultationChat, formatTime } from "@/lib/coach-utils";

interface ConsultationChatViewProps {
  activeConsultationId: string | null;
  consultationChats: ConsultationChat[];
}

export function ConsultationChatView({ activeConsultationId, consultationChats }: ConsultationChatViewProps) {
  if (!activeConsultationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center p-6">
        <div className="w-13 h-13 rounded-lg bg-surface-lowest border border-surface-high text-primary flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h3 className="font-headline text-lg font-bold m-0 mb-1.5 text-on-surface">Konsultasi Ahli Gizi</h3>
        <p className="text-[13px] max-w-90 leading-relaxed">Pilih sesi konsultasi di sidebar kiri untuk membuka riwayat pesan klinis.</p>
      </div>
    );
  }

  return (
    <>
      {consultationChats.length === 0 && (
        <div className="text-center my-4 mx-auto max-w-135 text-on-surface-variant text-[13px]">
          <p>Menunggu respons dari Ahli Gizi yang bertugas...</p>
          <p className="text-xs text-outline mt-1.5">Pesan disinkronisasikan secara langsung melalui WebSocket.</p>
        </div>
      )}

      {consultationChats.map((msg, i) => (
        <div key={msg.id || i} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] sm:max-w-[72%] py-3.5 px-4.5 rounded-lg text-sm leading-relaxed ${msg.sender === "user" ? "bg-primary text-on-primary rounded-br-sm" : "bg-surface-lowest text-on-surface rounded-bl-sm border border-surface-high border-l-3 border-l-macro-fat"}`}>
            {msg.sender === "nutritionist" && <div className="font-mono text-[10px] font-semibold tracking-wider text-macro-fat mb-1.5">AHLI GIZI KLINIS</div>}
            <p className="m-0 whitespace-pre-wrap">{msg.message}</p>
            <span className="block font-mono text-[10px] mt-2 opacity-65 text-right">{formatTime(msg.sent_at)}</span>
          </div>
        </div>
      ))}
    </>
  );
}
