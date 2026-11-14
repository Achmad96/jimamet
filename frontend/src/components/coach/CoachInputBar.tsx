import { FormEvent } from "react";
import { ViewMode, Consultation } from "@/lib/coach-utils";

interface CoachInputBarProps {
  viewMode: ViewMode;
  activeSessionId: string | null;
  activeConsultation: Consultation | null;
  input: string;
  consultationInput: string;
  isTyping: boolean;
  consultationSending: boolean;
  onInputChange: (val: string) => void;
  onConsultationInputChange: (val: string) => void;
  onSubmitCoach: (e: FormEvent) => void;
  onSubmitConsultation: (e: FormEvent) => void;
}

export function CoachInputBar({
  viewMode,
  activeSessionId,
  activeConsultation,
  input,
  consultationInput,
  isTyping,
  consultationSending,
  onInputChange,
  onConsultationInputChange,
  onSubmitCoach,
  onSubmitConsultation,
}: CoachInputBarProps) {
  if (viewMode === "coach") {
    return (
      <form
        onSubmit={onSubmitCoach}
        className="flex px-6 py-3.5 bg-surface-lowest border-t border-surface-high gap-2.5"
      >
        <input
          type="text"
          placeholder="Tanyakan analisis gizi atau rencana diet..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
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
    );
  }

  if (viewMode === "consultation" && activeConsultation) {
    return (
      <form
        onSubmit={onSubmitConsultation}
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
              onChange={(e) => onConsultationInputChange(e.target.value)}
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
    );
  }

  return null;
}
