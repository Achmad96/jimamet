import { FormEvent, RefObject } from "react";
import { ChatMsg } from "./PatientDetailClient";

interface PatientChatAreaProps {
  patientName: string;
  wsConnected: boolean;
  chatMsgs: ChatMsg[];
  chatInput: string;
  chatSending: boolean;
  consultationStatus: string;
  chatEndRef: RefObject<HTMLDivElement | null>;
  formatDateShort: (iso: string) => string;
  onChatInputChange: (val: string) => void;
  onDeleteMsg: (id: string) => void;
  onTangani: () => void;
  onSend: (e: FormEvent) => void;
}

export function PatientChatArea({ patientName, wsConnected, chatMsgs, chatInput, chatSending, consultationStatus, chatEndRef, formatDateShort, onChatInputChange, onDeleteMsg, onTangani, onSend }: PatientChatAreaProps) {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-surface-high bg-surface-lowest px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[18px]">forum</span>
          </div>
          <div>
            <h3 className="font-headline text-[15px] font-bold text-on-surface">Konsultasi: {patientName}</h3>
            <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-outline">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${wsConnected ? "bg-macro-fiber" : "bg-error"}`} />
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
                  <button className="flex cursor-pointer items-center p-0.5 text-inherit opacity-55 transition-opacity hover:opacity-100" onClick={() => onDeleteMsg(msg.id)} title="Hapus pesan">
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
          <button onClick={onTangani} className="cursor-pointer rounded-md bg-primary px-6 py-2.5 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary-container">
            Ambil Alih & Tangani Pasien
          </button>
        </div>
      ) : (
        <form className="flex gap-2.5 border-t border-surface-high bg-surface-lowest px-5 py-3.5" onSubmit={onSend}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
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
  );
}
