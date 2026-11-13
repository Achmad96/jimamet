import { useReducer, useMemo, useCallback, useRef, useEffect } from "react";
import {
  CoachSession,
  ChatMessage,
  Consultation,
  ConsultationChat,
  ViewMode,
  generateTempId,
} from "@/lib/coach-utils";
import {
  apiListCoachSessions,
  apiGetCoachSession,
  apiCreateCoachSession,
  apiDeleteCoachSession,
  apiSendCoachMessage,
  apiCreateConsultation,
  apiSendChat,
  apiListConsultations,
  apiListChat,
  getWsConsultationUrl,
} from "@/lib/api";

interface CoachChatState {
  sessions: CoachSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  consultations: Consultation[];
  consultationsLoaded: boolean;
  activeConsultationId: string | null;
  consultationChats: ConsultationChat[];
  consultationSending: boolean;
  wsConnected: boolean;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  input: string;
  consultationInput: string;
  konsultasiStatus: Record<string, "idle" | "loading" | "sent" | "error">;
}

type CoachChatAction =
  | { type: "SET_SESSIONS"; sessions: CoachSession[] }
  | { type: "SELECT_SESSION"; sessionId: string }
  | { type: "SET_MESSAGES"; messages: ChatMessage[] }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "UPDATE_SESSION"; session: CoachSession }
  | { type: "REMOVE_SESSION"; sessionId: string }
  | { type: "SET_IS_TYPING"; isTyping: boolean }
  | { type: "SET_CONSULTATIONS"; consultations: Consultation[]; loaded?: boolean }
  | { type: "SELECT_CONSULTATION"; consultationId: string }
  | { type: "SET_CONSULTATION_CHATS"; chats: ConsultationChat[] }
  | { type: "ADD_CONSULTATION_CHAT"; chat: ConsultationChat }
  | { type: "SET_CONSULTATION_SENDING"; sending: boolean }
  | { type: "SET_WS_CONNECTED"; connected: boolean }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SET_SIDEBAR_OPEN"; open: boolean }
  | { type: "SET_INPUT"; input: string }
  | { type: "SET_CONSULTATION_INPUT"; input: string }
  | { type: "SET_KONSULTASI_STATUS"; msgId: string; status: "idle" | "loading" | "sent" | "error" };

function coachChatReducer(state: CoachChatState, action: CoachChatAction): CoachChatState {
  switch (action.type) {
    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };
    case "SELECT_SESSION":
      return {
        ...state,
        viewMode: "coach",
        activeSessionId: action.sessionId,
        activeConsultationId: null,
        sidebarOpen: false,
      };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "UPDATE_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((s) => (s.id === action.session.id ? action.session : s)),
      };
    case "REMOVE_SESSION":
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.sessionId),
        activeSessionId: state.activeSessionId === action.sessionId ? null : state.activeSessionId,
        messages: state.activeSessionId === action.sessionId ? [] : state.messages,
      };
    case "SET_IS_TYPING":
      return { ...state, isTyping: action.isTyping };
    case "SET_CONSULTATIONS":
      return {
        ...state,
        consultations: action.consultations,
        consultationsLoaded: action.loaded !== undefined ? action.loaded : state.consultationsLoaded,
      };
    case "SELECT_CONSULTATION":
      return {
        ...state,
        viewMode: "consultation",
        activeConsultationId: action.consultationId,
        activeSessionId: null,
        sidebarOpen: false,
      };
    case "SET_CONSULTATION_CHATS":
      return { ...state, consultationChats: action.chats };
    case "ADD_CONSULTATION_CHAT":
      if (state.consultationChats.some((m) => m.id === action.chat.id && action.chat.id !== "")) {
        return state;
      }
      return { ...state, consultationChats: [...state.consultationChats, action.chat] };
    case "SET_CONSULTATION_SENDING":
      return { ...state, consultationSending: action.sending };
    case "SET_WS_CONNECTED":
      return { ...state, wsConnected: action.connected };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };
    case "SET_SIDEBAR_OPEN":
      return { ...state, sidebarOpen: action.open };
    case "SET_INPUT":
      return { ...state, input: action.input };
    case "SET_CONSULTATION_INPUT":
      return { ...state, consultationInput: action.input };
    case "SET_KONSULTASI_STATUS":
      return {
        ...state,
        konsultasiStatus: { ...state.konsultasiStatus, [action.msgId]: action.status },
      };
    default:
      return state;
  }
}

interface UseCoachChatOptions {
  initialSessions?: CoachSession[];
  initialMessages?: ChatMessage[];
  initialConsultations?: Consultation[];
}

export function useCoachChat(options: UseCoachChatOptions = {}) {
  const { initialSessions = [], initialMessages = [], initialConsultations = [] } = options;

  const [state, dispatch] = useReducer(coachChatReducer, {
    sessions: initialSessions,
    activeSessionId: initialSessions.length > 0 ? initialSessions[0].id : null,
    messages: initialMessages,
    isTyping: false,
    consultations: initialConsultations,
    consultationsLoaded: initialConsultations.length > 0,
    activeConsultationId: null,
    consultationChats: [],
    consultationSending: false,
    wsConnected: false,
    viewMode: "coach",
    sidebarOpen: false,
    input: "",
    consultationInput: "",
    konsultasiStatus: {},
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Derived values using useMemo
  const activeSession = useMemo(
    () => state.sessions.find((s) => s.id === state.activeSessionId) || null,
    [state.sessions, state.activeSessionId]
  );

  const activeConsultation = useMemo(
    () => state.consultations.find((c) => c.id === state.activeConsultationId) || null,
    [state.consultations, state.activeConsultationId]
  );

  const pendingConsultationsCount = useMemo(
    () => state.consultations.filter((c) => c.status === "pending").length,
    [state.consultations]
  );

  // Auto-scroll on chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isTyping, state.consultationChats]);

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Fetch initial sessions if none provided from SSR
  useEffect(() => {
    if (initialSessions.length > 0) return;

    let ignore = false;
    apiListCoachSessions()
      .then(async ({ ok, data }) => {
        if (ignore) return;
        if (ok && Array.isArray(data)) {
          dispatch({ type: "SET_SESSIONS", sessions: data });
          if (data.length > 0) {
            const firstId = data[0].id;
            dispatch({ type: "SELECT_SESSION", sessionId: firstId });
            const res = await apiGetCoachSession(firstId);
            if (!ignore && res.ok) {
              dispatch({ type: "SET_MESSAGES", messages: res.data.messages || [] });
            }
          }
        }
      })
      .catch(console.error);

    return () => {
      ignore = true;
    };
  }, [initialSessions.length]);

  // Stable callbacks using useCallback
  const closeWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      dispatch({ type: "SET_WS_CONNECTED", connected: false });
    }
  }, []);

  const selectSession = useCallback(
    async (sessionId: string) => {
      closeWs();
      dispatch({ type: "SELECT_SESSION", sessionId });
      try {
        const { ok, data } = await apiGetCoachSession(sessionId);
        if (ok) {
          dispatch({ type: "SET_MESSAGES", messages: data.messages || [] });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [closeWs]
  );

  const handleNewSession = useCallback(async () => {
    try {
      const { ok, data } = await apiCreateCoachSession("Sesi Konsultasi Baru");
      if (ok && data) {
        closeWs();
        dispatch({ type: "SET_SESSIONS", sessions: [data, ...state.sessions] });
        dispatch({ type: "SELECT_SESSION", sessionId: data.id });
        dispatch({ type: "SET_MESSAGES", messages: [] });
      } else {
        alert(data?.error || "Gagal membuat sesi baru. Periksa backend.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    }
  }, [closeWs, state.sessions]);

  const handleDeleteSession = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      if (!confirm("Hapus sesi konsultasi ini?")) return;
      try {
        const { ok } = await apiDeleteCoachSession(sessionId);
        if (ok) {
          dispatch({ type: "REMOVE_SESSION", sessionId });
        }
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !state.activeSessionId) return;

      const userMsg: ChatMessage = {
        id: generateTempId("temp"),
        session_id: state.activeSessionId,
        sender: "user",
        message: text,
        needs_consultation: false,
        sent_at: new Date().toISOString(),
      };

      dispatch({ type: "ADD_MESSAGE", message: userMsg });
      dispatch({ type: "SET_INPUT", input: "" });
      dispatch({ type: "SET_IS_TYPING", isTyping: true });

      try {
        const res = await apiSendCoachMessage(state.activeSessionId, text);
        if (res.ok) {
          const aiMsg: ChatMessage = {
            id: generateTempId("temp-ai"),
            session_id: state.activeSessionId,
            sender: "ai",
            message: res.data.reply,
            needs_consultation: res.data.needs_consultation,
            sent_at: new Date().toISOString(),
          };
          dispatch({ type: "ADD_MESSAGE", message: aiMsg });

          if (res.data.session) {
            dispatch({ type: "UPDATE_SESSION", session: res.data.session });
          }
        } else {
          dispatch({
            type: "ADD_MESSAGE",
            message: {
              id: generateTempId("temp-err"),
              session_id: state.activeSessionId,
              sender: "ai",
              message: "Maaf, sistem AI sedang mengalami kendala. Silakan coba beberapa saat lagi.",
              needs_consultation: false,
              sent_at: new Date().toISOString(),
            },
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        dispatch({ type: "SET_IS_TYPING", isTyping: false });
      }
    },
    [state.activeSessionId]
  );

  const loadConsultations = useCallback(async () => {
    try {
      const { ok, data } = await apiListConsultations();
      if (ok && Array.isArray(data)) {
        dispatch({ type: "SET_CONSULTATIONS", consultations: data, loaded: true });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleShowConsultations = useCallback(async () => {
    if (!state.consultationsLoaded) {
      await loadConsultations();
    }
  }, [state.consultationsLoaded, loadConsultations]);

  const connectWebSocket = useCallback(
    (consultationId: string) => {
      closeWs();

      const wsUrl = getWsConsultationUrl(consultationId);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        dispatch({ type: "SET_WS_CONNECTED", connected: true });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "chat_message") {
            const newMsg: ConsultationChat = {
              id: data.id || generateTempId("ws"),
              consultation_id: consultationId,
              sender: data.sender,
              message: data.message,
              sent_at: data.sent_at,
            };
            dispatch({ type: "ADD_CONSULTATION_CHAT", chat: newMsg });

            apiListConsultations().then(({ ok, data }) => {
              if (ok && Array.isArray(data)) {
                dispatch({ type: "SET_CONSULTATIONS", consultations: data });
              }
            });
          }
        } catch (e) {
          console.error("WS error:", e);
        }
      };

      ws.onclose = () => {
        dispatch({ type: "SET_WS_CONNECTED", connected: false });
      };

      ws.onerror = () => {
        dispatch({ type: "SET_WS_CONNECTED", connected: false });
      };

      wsRef.current = ws;
    },
    [closeWs]
  );

  const selectConsultation = useCallback(
    async (consultationId: string) => {
      dispatch({ type: "SELECT_CONSULTATION", consultationId });

      try {
        const { ok, data } = await apiListChat(consultationId);
        if (ok && Array.isArray(data)) {
          dispatch({ type: "SET_CONSULTATION_CHATS", chats: data });
        }
      } catch (e) {
        console.error(e);
      }

      connectWebSocket(consultationId);
    },
    [connectWebSocket]
  );

  const handleSendConsultationChat = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.consultationInput.trim() || !state.activeConsultationId || state.consultationSending) return;

      dispatch({ type: "SET_CONSULTATION_SENDING", sending: true });
      const text = state.consultationInput.trim();
      dispatch({ type: "SET_CONSULTATION_INPUT", input: "" });

      try {
        const { ok, data } = await apiSendChat(state.activeConsultationId, text, "user");
        if (ok) {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                id: data?.id || generateTempId("sent"),
                message: text,
                sender: "user",
                sent_at: new Date().toISOString(),
              })
            );
          } else {
            dispatch({
              type: "ADD_CONSULTATION_CHAT",
              chat: {
                id: data?.id || generateTempId("local"),
                consultation_id: state.activeConsultationId,
                sender: "user",
                message: text,
                sent_at: new Date().toISOString(),
              },
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        dispatch({ type: "SET_CONSULTATION_SENDING", sending: false });
      }
    },
    [state.consultationInput, state.activeConsultationId, state.consultationSending]
  );

  const handleKirimKonsultasi = useCallback(
    async (msgId: string, contextMsgText: string) => {
      dispatch({ type: "SET_KONSULTASI_STATUS", msgId, status: "loading" });
      const pesanCoachbot = `Pasien membutuhkan konsultasi terkait riwayat percakapan. Sistem NutriCoach AI menyarankan penanganan langsung dari ahli gizi untuk kondisi ini. Konteks: "${contextMsgText.substring(0, 50)}..."`;

      try {
        const { ok, data } = await apiCreateConsultation(pesanCoachbot);
        if (ok && data?.id) {
          await apiSendChat(data.id, "Halo Ahli Gizi, saya diarahkan oleh NutriCoach AI untuk berkonsultasi.", "user");

          dispatch({ type: "SET_KONSULTASI_STATUS", msgId, status: "sent" });

          const closingMsg: ChatMessage = {
            id: generateTempId("closing"),
            session_id: state.activeSessionId || "",
            sender: "ai",
            message:
              'Permintaan konsultasi klinis Anda telah diteruskan ke **Ahli Gizi**.\n\nSilakan buka panel **"Konsultasi Ahli Gizi"** di sidebar kiri untuk melanjutkan diskusi secara langsung.',
            needs_consultation: false,
            sent_at: new Date().toISOString(),
          };
          dispatch({ type: "ADD_MESSAGE", message: closingMsg });

          await loadConsultations();

          setTimeout(async () => {
            if (state.activeSessionId) {
              const currentId = state.activeSessionId;
              dispatch({ type: "REMOVE_SESSION", sessionId: currentId });
              await apiDeleteCoachSession(currentId);
            }
          }, 3000);
        } else {
          throw new Error("Failed to create consultation");
        }
      } catch {
        dispatch({ type: "SET_KONSULTASI_STATUS", msgId, status: "error" });
        alert("Gagal mengirim permintaan konsultasi.");
      }
    },
    [state.activeSessionId, loadConsultations]
  );

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_SIDEBAR_OPEN", open });
  }, []);

  const setInput = useCallback((input: string) => {
    dispatch({ type: "SET_INPUT", input });
  }, []);

  const setConsultationInput = useCallback((input: string) => {
    dispatch({ type: "SET_CONSULTATION_INPUT", input });
  }, []);

  return {
    state,
    activeSession,
    activeConsultation,
    pendingConsultationsCount,
    messagesEndRef,
    setInput,
    setConsultationInput,
    setSidebarOpen,
    selectSession,
    handleNewSession,
    handleDeleteSession,
    sendMessage,
    loadConsultations,
    handleShowConsultations,
    selectConsultation,
    handleSendConsultationChat,
    handleKirimKonsultasi,
  };
}
