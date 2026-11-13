import { FormEvent } from "react";

interface AuthLoginFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  inputBaseClass: string;
  onUsernameChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function AuthLoginForm({ username, password, showPassword, isLoading, inputBaseClass, onUsernameChange, onPasswordChange, onToggleShowPassword, onSubmit }: AuthLoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Username</label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input type="text" required placeholder="Masukkan username" value={username} onChange={(e) => onUsernameChange(e.target.value)} className={inputBaseClass} />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Password</label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input type={showPassword ? "text" : "password"} required placeholder="Masukkan password" value={password} onChange={(e) => onPasswordChange(e.target.value)} className={`${inputBaseClass} pr-10`} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-outline hover:text-on-surface cursor-pointer p-0 flex items-center" onClick={onToggleShowPassword}>
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
        className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
        {isLoading ? (
          <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
  );
}
