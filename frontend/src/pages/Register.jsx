import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setMessage({ text: "Semua field harus diisi.", type: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage({ text: "Format email tidak valid.", type: "error" });
      return;
    }

    if (form.password.length < 8) {
      setMessage({ text: "Password minimal 8 karakter.", type: "error" });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Konfirmasi password tidak cocok.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(form.name, form.email, form.password);
      if (result.success) {
        setMessage({ text: result.message, type: "success" });
        setTimeout(() => navigate("/login"), 1500);
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
        <h1>Daftar Akun</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
            />
          </div>
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
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Ulangi password"
            />
          </div>
          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>
        <p className="auth-link">
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
