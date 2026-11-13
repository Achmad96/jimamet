import { CoachClient } from "@/components/coach/CoachClient";
import { getServerCoachSessions, getServerCoachSession, getServerConsultations } from "@/lib/server-api";
import { CoachSession, ChatMessage, Consultation } from "@/lib/coach-utils";

export const metadata = {
  title: "NutriCoach AI | Jimamet",
  description: "Konsultasi interaktif nutrisi berbasis AI dan rujukan ahli gizi."
};

export default async function NutriCoachPage() {
  let sessions: CoachSession[] = [];
  let initialMessages: ChatMessage[] = [];
  let consultations: Consultation[] = [];

  try {
    const [sessionsRes, consultRes] = await Promise.all([getServerCoachSessions(), getServerConsultations()]);

    if (sessionsRes.ok && Array.isArray(sessionsRes.data)) {
      sessions = sessionsRes.data;
      if (sessions.length > 0) {
        const firstSessionId = sessions[0].id;
        const sessionDetailRes = await getServerCoachSession(firstSessionId);
        if (sessionDetailRes.ok && sessionDetailRes.data?.messages) {
          initialMessages = sessionDetailRes.data.messages;
        }
      }
    }

    if (consultRes.ok && Array.isArray(consultRes.data)) {
      consultations = consultRes.data as unknown as Consultation[];
    }
  } catch (error) {
    console.error("Error pre-fetching coach data on server:", error);
  }

  return <CoachClient initialSessions={sessions} initialMessages={initialMessages} initialConsultations={consultations} />;
}
