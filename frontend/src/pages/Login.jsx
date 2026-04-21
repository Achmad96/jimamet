import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!form.email || !form.password) {
      setMessage({ text: "Semua field harus diisi.", type: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage({ text: "Format email tidak valid.", type: "error" });
      return;
    }

    if (form.password.length < 6) {
      setMessage({ text: "Password minimal 6 karakter.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(form.email, form.password);
      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("message", result.message);
        navigate("/");
      } else {
        setMessage({ text: result.message, type: "error" });
      }
    } catch {
      setMessage({ text: "Gagal terhubung ke server.", type: "error" });
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Masukkan email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Masukkan password"
            />
          </div>
          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>
        <p className="auth-link">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
