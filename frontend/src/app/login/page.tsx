"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiLogin, apiRegister } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ── Login State ── */
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  /* ── Register State ── */
  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    age: "",
    weight: "",
    height: "",
    activity_level: "moderate",
  });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { ok, data } = await apiLogin(loginData);
      if (ok) {
        if (data.role === "ahli_gizi") {
          setSuccess("Login berhasil! Mengalihkan ke Portal Ahli Gizi...");
          setTimeout(() => router.push("/ahli-gizi"), 1000);
        } else {
          setSuccess("Login berhasil! Mengalihkan...");
          setTimeout(() => router.push("/dashboard"), 1000);
        }
      } else {
        setError(data.error || data.detail || (data && JSON.stringify(data)) || "Login gagal. Periksa kredensial Anda.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Password tidak cocok.");
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 8) {
      setError("Password minimal 8 karakter.");
      setIsLoading(false);
      return;
    }

    try {
      const { ok, data } = await apiRegister({
        full_name: registerData.full_name,
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
        age: registerData.age ? parseInt(registerData.age) : undefined,
        weight: registerData.weight ? parseFloat(registerData.weight) : undefined,
        height: registerData.height ? parseFloat(registerData.height) : undefined,
        activity_level: registerData.activity_level,
      });

      if (ok) {
        setSuccess("Registrasi berhasil! Silakan login.");
        setActiveTab("login");
        setLoginData({ username: registerData.username, password: "" });
        setRegisterData({
          full_name: "",
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
          age: "",
          weight: "",
          height: "",
          activity_level: "moderate",
        });
      } else {
        setError(data.error || data.detail || (data && JSON.stringify(data)) || "Registrasi gagal.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
  };

  const inputBaseClass =
    "w-full py-2.5 pl-10 pr-3.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 placeholder:text-outline";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-surface">
      {/* ── LEFT PANEL — Clinical Editorial Showcase ── */}
      <div className="hidden lg:flex relative overflow-hidden items-end p-12 border-r border-surface-high">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d2418]/95 via-[#143625]/82 to-[#143625]/68 z-10" />
        <img
          src="/hero-nutrition.png"
          alt="Healthy nutritious food"
          className="absolute inset-0 w-full h-full object-cover saturate-85"
        />
        <div className="relative z-20 text-white flex flex-col gap-9 max-w-[480px] w-full">
          <Link href="/" className="inline-flex items-center gap-2.5 no-underline text-white">
            <Image src="/jimamet_logo.webp" alt="Jimamet Logo" width={40} height={40} className="object-contain" />
            <span className="font-headline text-xl font-bold tracking-tight">Jimamet</span>
            <span className="font-mono text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-sm bg-white/14 text-primary-fixed">
              CLINICAL
            </span>
          </Link>
          <div>
            <span className="block font-mono text-[11px] font-semibold tracking-widest text-primary-fixed-dim mb-2.5">
              TELEMETRI NUTRISI & DIETETIKA
            </span>
            <h1 className="font-headline text-3xl xl:text-[34px] font-bold leading-[1.16] tracking-[-0.025em] mb-3.5">
              Rekam gizi presisi untuk keputusan klinis harian.
            </h1>
            <p className="text-[15px] leading-[1.65] text-white/80">
              Identifikasi komponen makronutrien makanan secara otomatis melalui visi komputer dan terhubung langsung dengan evaluasi Ahli Gizi.
            </p>
          </div>
          <div className="flex items-center gap-6 px-5 py-4 bg-black/28 border border-white/14 rounded-lg backdrop-blur-md">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-lg font-bold tracking-tight">YOLOv8</span>
              <span className="text-[11px] text-white/70">Deteksi Visual</span>
            </div>
            <div className="w-px h-7 bg-white/15" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-lg font-bold tracking-tight">500+</span>
              <span className="text-[11px] text-white/70">Indeks Pangan</span>
            </div>
            <div className="w-px h-7 bg-white/15" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-lg font-bold tracking-tight">Live WS</span>
              <span className="text-[11px] text-white/70">Konsultasi Gizi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-surface overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-headline text-[26px] font-bold text-on-surface tracking-tight mb-1.5">
              Selamat Datang
            </h2>
            <p className="text-sm text-on-surface-variant">
              Silakan masuk atau daftar untuk melanjutkan.
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 bg-surface-container border border-surface-high rounded-md p-1 mb-6">
            <button
              type="button"
              className={`py-2.5 px-4 border-none rounded-[6px] font-headline text-[13px] font-semibold cursor-pointer transition-all ${
                activeTab === "login"
                  ? "bg-surface-lowest text-primary shadow-xs"
                  : "bg-transparent text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => switchTab("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`py-2.5 px-4 border-none rounded-[6px] font-headline text-[13px] font-semibold cursor-pointer transition-all ${
                activeTab === "register"
                  ? "bg-surface-lowest text-primary shadow-xs"
                  : "bg-transparent text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => switchTab("register")}
            >
              Registrasi
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-[13px] font-medium mb-5 bg-error-container text-error border border-error/25">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-[13px] font-medium mb-5 bg-primary-fixed text-primary border border-primary/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-username" className="text-xs font-semibold text-on-surface">
                  Username
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Masukkan username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-on-surface">
                  Password
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className={`${inputBaseClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 bg-transparent border-none text-outline hover:text-on-surface cursor-pointer p-1 flex items-center justify-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 px-5 mt-1 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-sm font-semibold cursor-pointer transition-colors disabled:opacity-65 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-fullname" className="text-xs font-semibold text-on-surface">
                  Nama Lengkap
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="reg-fullname"
                    type="text"
                    placeholder="Nama lengkap Anda"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-email" className="text-xs font-semibold text-on-surface">
                  Email
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-username" className="text-xs font-semibold text-on-surface">
                  Username
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="reg-username"
                    type="text"
                    placeholder="Pilih username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-password" className="text-xs font-semibold text-on-surface">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className={`${inputBaseClass} pr-10`}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 bg-transparent border-none text-outline hover:text-on-surface cursor-pointer p-1 flex items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-confirm" className="text-xs font-semibold text-on-surface">
                    Konfirmasi
                  </label>
                  <div className="relative flex items-center">
                    <svg className="absolute left-3.5 text-outline pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className={`${inputBaseClass} pr-10`}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 bg-transparent border-none text-outline hover:text-on-surface cursor-pointer p-1 flex items-center justify-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Fisik */}
              <div className="flex items-center gap-3 mt-1 before:content-[''] before:flex-1 before:h-px before:bg-surface-high after:content-[''] after:flex-1 after:h-px after:bg-surface-high">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-outline">
                  Data Antropometri
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-age" className="text-xs font-semibold text-on-surface">
                    Usia (thn)
                  </label>
                  <input
                    id="reg-age"
                    type="number"
                    placeholder="25"
                    value={registerData.age}
                    onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                    className="w-full py-2.5 px-3 border border-surface-high rounded-md font-mono text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 tabular-nums"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-weight" className="text-xs font-semibold text-on-surface">
                    Berat (kg)
                  </label>
                  <input
                    id="reg-weight"
                    type="number"
                    step="0.1"
                    placeholder="65"
                    value={registerData.weight}
                    onChange={(e) => setRegisterData({ ...registerData, weight: e.target.value })}
                    className="w-full py-2.5 px-3 border border-surface-high rounded-md font-mono text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 tabular-nums"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-height" className="text-xs font-semibold text-on-surface">
                    Tinggi (cm)
                  </label>
                  <input
                    id="reg-height"
                    type="number"
                    step="0.1"
                    placeholder="170"
                    value={registerData.height}
                    onChange={(e) => setRegisterData({ ...registerData, height: e.target.value })}
                    className="w-full py-2.5 px-3 border border-surface-high rounded-md font-mono text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-activity" className="text-xs font-semibold text-on-surface">
                  Tingkat Aktivitas Harian
                </label>
                <div className="relative flex items-center">
                  <select
                    id="reg-activity"
                    value={registerData.activity_level}
                    onChange={(e) => setRegisterData({ ...registerData, activity_level: e.target.value })}
                    className="w-full py-2.5 pl-3.5 pr-9 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 appearance-none cursor-pointer"
                    required
                  >
                    <option value="sedentary">Sangat Jarang Olahraga</option>
                    <option value="light">Jarang Olahraga (1-3 hari/minggu)</option>
                    <option value="moderate">Normal Olahraga (3-5 hari/minggu)</option>
                    <option value="active">Sering Olahraga (6-7 hari/minggu)</option>
                    <option value="very_active">Sangat Sering Olahraga</option>
                  </select>
                  <svg className="absolute right-3.5 text-outline pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 px-5 mt-1 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-sm font-semibold cursor-pointer transition-colors disabled:opacity-65 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Daftar Sekarang
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-outline">
            <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">
              Lupa Password?
            </a>
            <span className="text-outline-variant">·</span>
            <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">
              Butuh bantuan?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
