"use client";

import { useReducer, useCallback, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiLogin, apiRegister } from "@/lib/api";
import { AuthHeroPanel } from "./AuthHeroPanel";
import { AuthLoginForm } from "./AuthLoginForm";
import { AuthRegisterForm, RegisterFormData } from "./AuthRegisterForm";

interface LoginData {
  username: string;
  password: string;
}

interface AuthFormState {
  activeTab: "login" | "register";
  isLoading: boolean;
  error: string;
  success: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loginData: LoginData;
  registerData: RegisterFormData;
}

type AuthFormAction =
  | { type: "SET_TAB"; tab: "login" | "register" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_SUCCESS"; success: string }
  | { type: "TOGGLE_SHOW_PASSWORD" }
  | { type: "TOGGLE_SHOW_CONFIRM_PASSWORD" }
  | { type: "UPDATE_LOGIN"; field: keyof LoginData; value: string }
  | { type: "UPDATE_REGISTER"; field: keyof RegisterFormData; value: string }
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
        registerData: { ...state.registerData, [action.field]: action.value }
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
          activity_level: "moderate"
        },
        error: "",
        isLoading: false
      };
    default:
      return state;
  }
}

const inputBaseClass = "w-full py-2.5 pl-10 pr-3.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 placeholder:text-outline";

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
      activity_level: "moderate"
    }
  });

  const { activeTab, isLoading, error, success, showPassword, showConfirmPassword, loginData, registerData } = state;

  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_ERROR", error: "" });
      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const { ok, data } = await apiLogin(loginData);
        if (ok) {
          const userRole = data.user?.role;
          if (userRole === "ahli_gizi") {
            router.push("/ahli-gizi");
          } else {
            router.push("/dashboard");
          }
        } else {
          dispatch({
            type: "SET_ERROR",
            error: data.error || data.detail || "Username atau password salah."
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
          activity_level: registerData.activity_level
        });

        if (ok) {
          dispatch({ type: "SET_SUCCESS", success: "Registrasi berhasil! Silakan login." });
          dispatch({ type: "RESET_REGISTER_TO_LOGIN", username: registerData.username });
        } else {
          dispatch({
            type: "SET_ERROR",
            error: data.error || data.detail || (data && JSON.stringify(data)) || "Registrasi gagal."
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

  const handleRegisterFieldChange = useCallback((field: keyof RegisterFormData, value: string) => {
    dispatch({ type: "UPDATE_REGISTER", field, value });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-surface">
      {/* ── LEFT PANEL — Clinical Editorial Showcase ── */}
      <AuthHeroPanel />

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-surface overflow-y-auto">
        <div className="w-full max-w-110">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-headline text-[26px] font-bold text-on-surface tracking-tight mb-1.5">Selamat Datang</h2>
            <p className="text-sm text-on-surface-variant">Silakan masuk atau daftar untuk melanjutkan.</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 bg-surface-container border border-surface-high rounded-md p-1 mb-6">
            <button
              type="button"
              className={`py-2.5 px-4 border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-all ${activeTab === "login" ? "bg-surface-lowest text-primary shadow-xs" : "bg-transparent text-on-surface-variant hover:text-on-surface"}`}
              onClick={() => dispatch({ type: "SET_TAB", tab: "login" })}>
              Login
            </button>
            <button
              type="button"
              className={`py-2.5 px-4 border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-all ${activeTab === "register" ? "bg-surface-lowest text-primary shadow-xs" : "bg-transparent text-on-surface-variant hover:text-on-surface"}`}
              onClick={() => dispatch({ type: "SET_TAB", tab: "register" })}>
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
            <AuthLoginForm
              username={loginData.username}
              password={loginData.password}
              showPassword={showPassword}
              isLoading={isLoading}
              inputBaseClass={inputBaseClass}
              onUsernameChange={(val) => dispatch({ type: "UPDATE_LOGIN", field: "username", value: val })}
              onPasswordChange={(val) => dispatch({ type: "UPDATE_LOGIN", field: "password", value: val })}
              onToggleShowPassword={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
              onSubmit={handleLogin}
            />
          )}

          {/* ── REGISTER FORM ── */}
          {activeTab === "register" && (
            <AuthRegisterForm
              data={registerData}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              isLoading={isLoading}
              inputBaseClass={inputBaseClass}
              onChangeField={handleRegisterFieldChange}
              onToggleShowPassword={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
              onToggleShowConfirmPassword={() => dispatch({ type: "TOGGLE_SHOW_CONFIRM_PASSWORD" })}
              onSubmit={handleRegister}
            />
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
