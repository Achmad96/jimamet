import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, chatWithBot } from "../api";

function Home() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const msg = localStorage.getItem("message");
    const welcome = msg || "Selamat datang!";
    localStorage.removeItem("message");

    setMessages([
      { role: "bot", text: `${welcome}\nAku CoachBot, asisten kesehatan kamu. Tanya apa saja seputar kesehatan dan nutrisi!` }
    ]);
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const result = await chatWithBot(userMsg);
      setMessages((prev) => [...prev, { role: "bot", text: result.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Maaf, gagal terhubung ke server." }]);
    }
    setLoading(false);
  }

  async function handleLogout() {
    const token = localStorage.getItem("token");
    try {
      await logoutUser(token);
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("message");
    navigate("/login");
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>CoachBot</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble bot typing">Mengetik...</div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya seputar kesehatan..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Kirim</button>
      </form>
    </div>
  );
}

export default Home;
