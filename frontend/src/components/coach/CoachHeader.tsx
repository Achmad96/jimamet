import { ViewMode, Consultation, CoachSession } from "@/lib/coach-utils";

interface CoachHeaderProps {
  viewMode: ViewMode;
  activeSession?: CoachSession | null;
  activeConsultation: Consultation | null;
  wsConnected: boolean;
  onOpenSidebar: () => void;
}

export function CoachHeader({ viewMode, activeSession, activeConsultation, wsConnected, onOpenSidebar }: CoachHeaderProps) {
  return (
    <header className="flex items-center px-6 py-3.5 bg-surface-lowest border-b border-surface-high">
      <button className="block md:hidden bg-transparent border-none cursor-pointer p-1.5 mr-2 text-on-surface" onClick={onOpenSidebar}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {viewMode === "coach" ? (
        <>
          <div className="w-9 h-9 rounded-[8px] bg-primary flex items-center justify-center mr-3 shrink-0">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="m-0 font-headline text-[15px] font-bold text-on-surface">{activeSession?.title || "NutriCoach AI"}</h2>
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
            <h2 className="m-0 font-headline text-[15px] font-bold text-on-surface">{activeConsultation?.handled_by && activeConsultation.status === "pending" ? `Terhubung dengan ${activeConsultation.handled_by}` : "Konsultasi Ahli Gizi"}</h2>
            <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-primary" : "bg-error"}`} />
              {wsConnected ? "Kanal Real-time" : "Terputus"}
            </span>
          </div>
          <div className={`ml-auto px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold whitespace-nowrap ${wsConnected ? "bg-primary/8 text-primary" : "bg-error/8 text-error"}`}>● {wsConnected ? "WebSocket Aktif" : "WebSocket Terputus"}</div>
        </>
      )}
    </header>
  );
}
