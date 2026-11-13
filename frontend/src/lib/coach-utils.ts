export interface CoachSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: "user" | "ai";
  message: string;
  needs_consultation: boolean;
  sent_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  coach_message: string;
  status: "pending" | "completed" | "cancelled";
  handled_by?: string;
  created_at: string;
}

export interface ConsultationChat {
  id: string;
  consultation_id: string;
  sender: "user" | "nutritionist";
  message: string;
  sent_at: string;
}

export type ViewMode = "coach" | "consultation";

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) return `${diffMins || 1}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return "Kemarin";
    return `${diffDays}h lalu`;
  } catch {
    return "";
  }
}

export const quickReplies = [
  "Evaluasi rasio makronutrisi hari ini",
  "Rekomendasi menu makan malam tinggi protein",
  "Strategi defisit kalori berkelanjutan",
  "Saya memiliki keluhan pencernaan / klinis",
];

export const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "#d9822b" },
  completed: { label: "Selesai", color: "#143625" },
  cancelled: { label: "Dibatalkan", color: "#6f7771" },
};

export function generateTempId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
