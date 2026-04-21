import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api";

function Home() {
  const navigate = useNavigate();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const msg = localStorage.getItem("message");
    if (msg) {
      setWelcomeMessage(msg);
      localStorage.removeItem("message");
    } else {
      setWelcomeMessage("Selamat datang!");
    }
  }, [navigate]);

  async function handleLogout() {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      await logoutUser(token);
    } catch {
    }
    localStorage.removeItem("token");
    localStorage.removeItem("message");
    navigate("/login");
  }

  return (
    <div className="auth-container">
      <div className="auth-card home-card">
        <h1>{welcomeMessage}</h1>
        <button onClick={handleLogout} disabled={loading}>
          {loading ? "Memproses..." : "Logout"}
        </button>
      </div>
    </div>
  );
}

export default Home;
