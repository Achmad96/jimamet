import { FormEvent } from "react";

export interface RegisterFormData {
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

interface AuthRegisterFormProps {
  data: RegisterFormData;
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  isLoading: boolean;
  inputBaseClass: string;
  onChangeField: (field: keyof RegisterFormData, value: string) => void;
  onToggleShowPassword?: () => void;
  onToggleShowConfirmPassword?: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function AuthRegisterForm({ data, showPassword = false, showConfirmPassword = false, isLoading, inputBaseClass, onChangeField, onToggleShowPassword, onToggleShowConfirmPassword, onSubmit }: AuthRegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Nama Lengkap</label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input type="text" required placeholder="Nama lengkap Anda" value={data.full_name} onChange={(e) => onChangeField("full_name", e.target.value)} className={inputBaseClass} />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Email</label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input type="email" required placeholder="alamat@email.com" value={data.email} onChange={(e) => onChangeField("email", e.target.value)} className={inputBaseClass} />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Username</label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <input type="text" required placeholder="Pilih username unik" value={data.username} onChange={(e) => onChangeField("username", e.target.value)} className={inputBaseClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Min. 8 karakter"
              value={data.password}
              onChange={(e) => onChangeField("password", e.target.value)}
              className="w-full py-2.5 px-3 pr-9 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary"
            />
            {onToggleShowPassword && (
              <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface bg-transparent border-none p-0 cursor-pointer" onClick={onToggleShowPassword}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Konfirmasi Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Ulangi password"
              value={data.confirmPassword}
              onChange={(e) => onChangeField("confirmPassword", e.target.value)}
              className="w-full py-2.5 px-3 pr-9 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary"
            />
            {onToggleShowConfirmPassword && (
              <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface bg-transparent border-none p-0 cursor-pointer" onClick={onToggleShowConfirmPassword}>
                {showConfirmPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-outline mb-1">Usia (Th)</label>
          <input type="number" placeholder="25" value={data.age} onChange={(e) => onChangeField("age", e.target.value)} className="w-full py-2 px-2.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-outline mb-1">BB (kg)</label>
          <input type="number" step="0.1" placeholder="65" value={data.weight} onChange={(e) => onChangeField("weight", e.target.value)} className="w-full py-2 px-2.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-outline mb-1">TB (cm)</label>
          <input type="number" placeholder="170" value={data.height} onChange={(e) => onChangeField("height", e.target.value)} className="w-full py-2 px-2.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary" />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-1.5">Tingkat Aktivitas Fisik</label>
        <select value={data.activity_level} onChange={(e) => onChangeField("activity_level", e.target.value)} className="w-full py-2.5 px-3 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-lowest outline-none focus:border-primary">
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
        className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
        {isLoading ? (
          <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
  );
}
