"use client";

import { useReducer, useCallback, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiLogin, apiRegister } from "@/lib/api";

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  full_name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  age: string;
  weight: string;
  height: string;
  activity_level: string;
}

interface AuthFormState {
  activeTab: "login" | "register";
  isLoading: boolean;
  error: string;
  success: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loginData: LoginData;
  registerData: RegisterData;
}

type AuthFormAction =
  | { type: "SET_TAB"; tab: "login" | "register" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_SUCCESS"; success: string }
  | { type: "TOGGLE_SHOW_PASSWORD" }
  | { type: "TOGGLE_SHOW_CONFIRM_PASSWORD" }
  | { type: "UPDATE_LOGIN"; field: keyof LoginData; value: string }
  | { type: "UPDATE_REGISTER"; field: keyof RegisterData; value: string }
  | { type: "RESET_REGISTER_TO_LOGIN"; username: string };

function authReducer(state: AuthFormState, action: AuthFormAction): AuthFormState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab, error: "", success: "" };
    case "SET_LOADING":
      return { ...state, isLoading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, success: "", isLoading: false };
    case "SET_SUCCESS":
      return { ...state, success: action.success, error: "" };
    case "TOGGLE_SHOW_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "TOGGLE_SHOW_CONFIRM_PASSWORD":
      return { ...state, showConfirmPassword: !state.showConfirmPassword };
    case "UPDATE_LOGIN":
      return { ...state, loginData: { ...state.loginData, [action.field]: action.value } };
    case "UPDATE_REGISTER":
      return {
        ...state,
        registerData: { ...state.registerData, [action.field]: action.value },
      };
    case "RESET_REGISTER_TO_LOGIN":
      return {
        ...state,
        activeTab: "login",
        loginData: { username: action.username, password: "" },
        registerData: {
          full_name: "",
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
          age: "",
          weight: "",
          height: "",
          activity_level: "moderate",
        },
        error: "",
        isLoading: false,
      };
    default:
      return state;
  }
}

const inputBaseClass =
  "w-full py-2.5 pl-10 pr-3.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 placeholder:text-outline";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";

  const [state, dispatch] = useReducer(authReducer, {
    activeTab: initialTab,
    isLoading: false,
    error: "",
    success: "",
    showPassword: false,
    showConfirmPassword: false,
    loginData: { username: "", password: "" },
    registerData: {
      full_name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      age: "",
      weight: "",
      height: "",
      activity_level: "moderate",
    },
  });

  const {
    activeTab,
    isLoading,
    error,
    success,
    showPassword,
    showConfirmPassword,
    loginData,
    registerData,
  } = state;

  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_ERROR", error: "" });
      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const { ok, data } = await apiLogin(loginData);
        if (ok) {
          if (data.role === "ahli_gizi") {
            dispatch({ type: "SET_SUCCESS", success: "Login berhasil! Mengalihkan ke Portal Ahli Gizi..." });
            setTimeout(() => router.push("/ahli-gizi"), 1000);
          } else {
            dispatch({ type: "SET_SUCCESS", success: "Login berhasil! Mengalihkan..." });
            setTimeout(() => router.push("/dashboard"), 1000);
          }
        } else {
          dispatch({
            type: "SET_ERROR",
            error:
              data.error ||
              data.detail ||
              (data && JSON.stringify(data)) ||
              "Login gagal. Periksa kredensial Anda.",
          });
        }
      } catch {
        dispatch({ type: "SET_ERROR", error: "Tidak dapat terhubung ke server." });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [loginData, router]
  );

  const handleRegister = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_ERROR", error: "" });
      dispatch({ type: "SET_LOADING", loading: true });

      if (registerData.password !== registerData.confirmPassword) {
        dispatch({ type: "SET_ERROR", error: "Password tidak cocok." });
        return;
      }

      if (registerData.password.length < 8) {
        dispatch({ type: "SET_ERROR", error: "Password minimal 8 karakter." });
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
          dispatch({ type: "SET_SUCCESS", success: "Registrasi berhasil! Silakan login." });
          dispatch({ type: "RESET_REGISTER_TO_LOGIN", username: registerData.username });
        } else {
          dispatch({
            type: "SET_ERROR",
            error:
              data.error ||
              data.detail ||
              (data && JSON.stringify(data)) ||
              "Registrasi gagal.",
          });
        }
      } catch {
        dispatch({ type: "SET_ERROR", error: "Tidak dapat terhubung ke server." });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [registerData]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-surface">
      {/* ── LEFT PANEL — Clinical Editorial Showcase ── */}
      <div className="hidden lg:flex relative overflow-hidden items-end p-12 border-r border-surface-high">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d2418]/95 via-[#143625]/82 to-[#143625]/68 z-10" />
        <Image
          src="/hero-nutrition.png"
          alt="Healthy nutritious food"
          fill
          priority
          className="object-cover saturate-85"
          sizes="(min-width: 1024px) 50vw, 100vw"
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
              MONITORING NUTRISI & DIETETIKA
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
            <p className="text-sm text-on-surface-variant">Silakan masuk atau daftar untuk melanjutkan.</p>
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
              onClick={() => dispatch({ type: "SET_TAB", tab: "login" })}
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
              onClick={() => dispatch({ type: "SET_TAB", tab: "register" })}
            >
              Registrasi
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-[13px] font-medium mb-5 bg-error-container text-error border border-error/25">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-[13px] font-medium mb-5 bg-primary-fixed text-primary border border-primary/20">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username"
                    value={loginData.username}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_LOGIN",
                        field: "username",
                        value: e.target.value,
                      })
                    }
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan password"
                    value={loginData.password}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_LOGIN",
                        field: "password",
                        value: e.target.value,
                      })
                    }
                    className={`${inputBaseClass} pr-10`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-outline hover:text-on-surface cursor-pointer p-0 flex items-center"
                    onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk ke Sistem
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
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap Anda"
                    value={registerData.full_name}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_REGISTER", field: "full_name", value: e.target.value })
                    }
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    required
                    placeholder="alamat@email.com"
                    value={registerData.email}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_REGISTER", field: "email", value: e.target.value })
                    }
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  <input
                    type="text"
                    required
                    placeholder="Pilih username unik"
                    value={registerData.username}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_REGISTER", field: "username", value: e.target.value })
                    }
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min. 8 karakter"
                      value={registerData.password}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_REGISTER", field: "password", value: e.target.value })
                      }
                      className="w-full py-2.5 px-3 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Ulangi password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_REGISTER",
                          field: "confirmPassword",
                          value: e.target.value,
                        })
                      }
                      className="w-full py-2.5 px-3 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-outline mb-1">
                    Usia (Th)
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    value={registerData.age}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_REGISTER", field: "age", value: e.target.value })
                    }
                    className="w-full py-2 px-2.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-outline mb-1">
                    BB (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="65"
                    value={registerData.weight}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_REGISTER", field: "weight", value: e.target.value })
                    }
                    className="w-full py-2 px-2.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-outline mb-1">
                    TB (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="170"
                    value={registerData.height}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_REGISTER", field: "height", value: e.target.value })
                    }
                    className="w-full py-2 px-2.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">
                  Tingkat Aktivitas Fisik
                </label>
                <select
                  value={registerData.activity_level}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_REGISTER",
                      field: "activity_level",
                      value: e.target.value,
                    })
                  }
                  className="w-full py-2.5 px-3 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary"
                >
                  <option value="sedentary">Sedentari (Jarang berolahraga)</option>
                  <option value="light">Ringan (1-3 hari/minggu)</option>
                  <option value="moderate">Moderat (3-5 hari/minggu)</option>
                  <option value="active">Aktif (6-7 hari/minggu)</option>
                  <option value="veryActive">Sangat Aktif (2x sehari / atlet)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
