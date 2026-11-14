import { CoachSession, Consultation, ViewMode, formatRelativeTime, statusLabels } from "@/lib/coach-utils";

interface CoachSidebarProps {
  sidebarOpen: boolean;
  viewMode: ViewMode;
  sessions: CoachSession[];
  activeSessionId: string | null;
  consultations: Consultation[];
  consultationsLoaded: boolean;
  activeConsultationId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onShowConsultations: () => void;
  onSelectConsultation: (id: string) => void;
  onCloseSidebar: () => void;
}

export function CoachSidebar({
  sidebarOpen,
  viewMode,
  sessions,
  activeSessionId,
  consultations,
  consultationsLoaded,
  activeConsultationId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onShowConsultations,
  onSelectConsultation,
  onCloseSidebar,
}: CoachSidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-on-surface/40 z-20 md:hidden"
          onClick={onCloseSidebar}
        />
      )}

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
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-md font-body text-[13px] font-semibold cursor-pointer transition-all border-none ${
              viewMode === "coach" && activeSessionId === "draft"
                ? "bg-primary text-on-primary ring-2 ring-primary/30 shadow-xs"
                : "bg-primary hover:bg-primary-container text-on-primary"
            }`}
            onClick={onNewSession}
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
                onClick={() => onSelectSession(s.id)}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="text-[13px] font-semibold text-on-surface truncate">{s.title}</div>
                  <div className="font-mono text-[11px] text-outline mt-0.5">
                    {formatRelativeTime(s.updated_at)}
                  </div>
                </div>
                <button
                  className="bg-transparent border-none text-outline hover:text-error cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => onDeleteSession(e, s.id)}
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
          onClick={onShowConsultations}
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
                    onClick={() => onSelectConsultation(c.id)}
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
    </>
  );
}
