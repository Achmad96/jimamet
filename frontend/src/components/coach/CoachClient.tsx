"use client";

import { FormEvent } from "react";
import { useCoachChat } from "@/hooks/useCoachChat";
import { CoachSession, ChatMessage, Consultation } from "@/lib/coach-utils";
import { CoachSidebar } from "./CoachSidebar";
import { CoachHeader } from "./CoachHeader";
import { CoachAiChatView } from "./CoachAiChatView";
import { ConsultationChatView } from "./ConsultationChatView";
import { CoachInputBar } from "./CoachInputBar";

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
      {/* ── Sidebar Component ── */}
      <CoachSidebar
        sidebarOpen={sidebarOpen}
        viewMode={viewMode}
        sessions={sessions}
        activeSessionId={activeSessionId}
        consultations={consultations}
        consultationsLoaded={consultationsLoaded}
        activeConsultationId={activeConsultationId}
        onNewSession={handleNewSession}
        onSelectSession={selectSession}
        onDeleteSession={handleDeleteSession}
        onShowConsultations={handleShowConsultations}
        onSelectConsultation={selectConsultation}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* ── Main Chat Area ── */}
      <main className="flex-1 flex flex-col bg-surface min-w-0">
        <CoachHeader
          viewMode={viewMode}
          activeSession={activeSession}
          activeConsultation={activeConsultation}
          wsConnected={wsConnected}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3.5">
          {viewMode === "coach" && (
            <CoachAiChatView
              activeSessionId={activeSessionId}
              messages={messages}
              isTyping={isTyping}
              konsultasiStatus={konsultasiStatus}
              onNewSession={handleNewSession}
              onSendMessage={sendMessage}
              onKirimKonsultasi={handleKirimKonsultasi}
            />
          )}

          {viewMode === "consultation" && (
            <ConsultationChatView
              activeConsultationId={activeConsultationId}
              consultationChats={consultationChats}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar Component ── */}
        <CoachInputBar
          viewMode={viewMode}
          activeSessionId={activeSessionId}
          activeConsultation={activeConsultation}
          input={input}
          consultationInput={consultationInput}
          isTyping={isTyping}
          consultationSending={consultationSending}
          onInputChange={setInput}
          onConsultationInputChange={setConsultationInput}
          onSubmitCoach={handleCoachSubmit}
          onSubmitConsultation={handleSendConsultationChat}
        />
      </main>
    </div>
  );
}
