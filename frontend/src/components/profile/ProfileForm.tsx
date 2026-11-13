"use client";

import { useReducer, useMemo, useCallback, useRef, useEffect } from "react";
import { apiUpdateProfile } from "@/lib/api";
import { calculateBMI, calculateBMR, calculateTDEE, ProfileData } from "@/lib/profile-utils";

interface ProfileFormProps {
  initialProfile: ProfileData;
  todayCalories: number;
}

const fieldInputClass =
  "w-full py-2.5 px-3.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-low outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-3 focus:ring-primary/10";

interface FormState {
  profile: ProfileData;
  saved: boolean;
  saving: boolean;
}

type FormAction =
  | { type: "UPDATE_FIELD"; field: keyof ProfileData; value: string }
  | { type: "START_SAVING" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR" }
  | { type: "RESET_SAVED" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        profile: { ...state.profile, [action.field]: action.value },
        saved: false,
      };
    case "START_SAVING":
      return { ...state, saving: true };
    case "SAVE_SUCCESS":
      return { ...state, saving: false, saved: true };
    case "SAVE_ERROR":
      return { ...state, saving: false };
    case "RESET_SAVED":
      return { ...state, saved: false };
    default:
      return state;
  }
}

export function ProfileForm({ initialProfile, todayCalories }: ProfileFormProps) {
  const [state, dispatch] = useReducer(formReducer, {
    profile: initialProfile,
    saved: false,
    saving: false,
  });

  const { profile, saved, saving } = state;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = useCallback((field: keyof ProfileData, value: string) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  }, []);

  const handleSave = useCallback(async () => {
    dispatch({ type: "START_SAVING" });
    const { ok, data } = await apiUpdateProfile({
      full_name: profile.fullName,
      age: profile.age ? parseInt(profile.age) : null,
      weight: profile.weight ? parseFloat(profile.weight) : null,
      height: profile.height ? parseFloat(profile.height) : null,
      gender: profile.gender,
      activity_level: profile.activityLevel,
      goal: profile.goal,
    });

    if (ok) {
      dispatch({ type: "SAVE_SUCCESS" });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: "RESET_SAVED" });
      }, 3000);
    } else {
      dispatch({ type: "SAVE_ERROR" });
      alert(data?.error || "Gagal menyimpan profil. Periksa koneksi atau backend.");
    }
  }, [profile]);

  const weightNum = useMemo(() => parseFloat(profile.weight), [profile.weight]);
  const heightNum = useMemo(() => parseFloat(profile.height), [profile.height]);
  const ageNum = useMemo(() => parseInt(profile.age), [profile.age]);

  const bmiInfo = useMemo(
    () => calculateBMI(weightNum, heightNum),
    [weightNum, heightNum]
  );
  const bmr = useMemo(
    () => calculateBMR(weightNum, heightNum, ageNum, profile.gender),
    [weightNum, heightNum, ageNum, profile.gender]
  );
  const estimatedCalories = useMemo(
    () => (bmr ? calculateTDEE(bmr, profile.activityLevel, profile.goal) : null),
    [bmr, profile.activityLevel, profile.goal]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end pb-4 border-b border-surface-high">
        <div>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Kelola Profil Klinis
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Konfigurasi metrik fisiologis untuk kalibrasi kebutuhan energi harian (TDEE).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-stretch">
        {/* ROW 1: Personal Info & Avatar */}
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
          <h3 className="font-headline text-[15px] font-bold text-on-surface flex items-center gap-2.5 pb-3 border-b border-surface-container">
            <svg className="text-primary" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Identitas Pengguna
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Nama Lengkap</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className={fieldInputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className={`${fieldInputClass} opacity-70 cursor-not-allowed`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Username</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className={`${fieldInputClass} opacity-70 cursor-not-allowed`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Usia</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className={`${fieldInputClass} pr-12 font-mono tabular-nums`}
                />
                <span className="absolute right-3.5 font-mono text-xs font-medium text-outline pointer-events-none">
                  thn
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-7 text-center flex flex-col items-center justify-center gap-1.5">
          <div className="w-17 h-17 rounded-lg bg-primary flex items-center justify-center mb-1.5">
            <span className="font-headline text-[28px] font-bold text-on-primary">
              {(profile.fullName || "P").charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="font-headline text-[17px] font-bold text-on-surface">
            {profile.fullName || "Pengguna"}
          </h3>
          <p className="font-mono text-xs text-outline">@{profile.username || "user"}</p>
          <span className="mt-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary font-mono text-[10px] font-semibold tracking-wider">
            AKUN PASIEN AKTIF
          </span>
        </div>

        {/* ROW 2: Body Metrics & BMI */}
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
          <h3 className="font-headline text-[15px] font-bold text-on-surface flex items-center gap-2.5 pb-3 border-b border-surface-container">
            <svg className="text-primary" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Parameter Antropometri
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Berat Badan</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  className={`${fieldInputClass} pr-12 font-mono tabular-nums`}
                />
                <span className="absolute right-3.5 font-mono text-xs font-medium text-outline pointer-events-none">
                  kg
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Tinggi Badan</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  className={`${fieldInputClass} pr-12 font-mono tabular-nums`}
                />
                <span className="absolute right-3.5 font-mono text-xs font-medium text-outline pointer-events-none">
                  cm
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Jenis Kelamin Biologis</label>
              <select
                value={profile.gender}
                onChange={(e) => handleChange("gender", e.target.value as "male" | "female")}
                className={fieldInputClass}
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Faktor Aktivitas Fisik (PAL)</label>
              <select
                value={profile.activityLevel}
                onChange={(e) =>
                  handleChange(
                    "activityLevel",
                    e.target.value as ProfileData["activityLevel"]
                  )
                }
                className={fieldInputClass}
              >
                <option value="sedentary">Sedentari (minim gerak)</option>
                <option value="light">Ringan (1–3x latihan/minggu)</option>
                <option value="moderate">Moderat (3–5x latihan/minggu)</option>
                <option value="active">Aktif (6–7x latihan/minggu)</option>
                <option value="very_active">Sangat Aktif (intensitas tinggi)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 text-center flex flex-col items-center justify-center gap-2.5">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-outline uppercase">
            INDEKS MASSA TUBUH (IMT / BMI)
          </span>
          <div
            className="font-mono text-[40px] font-bold leading-none tabular-nums tracking-tight"
            style={{ color: bmiInfo?.color || "#6f7771" }}
          >
            {bmiInfo?.bmi ?? "—"}
          </div>
          <span
            className="px-3 py-1 rounded-[6px] font-mono text-[11px] font-semibold"
            style={{
              background: bmiInfo ? `${bmiInfo.color}14` : "#6f777114",
              color: bmiInfo?.color || "#6f7771",
            }}
          >
            {bmiInfo ? `${bmiInfo.category}` : "Belum Terkalkulasi"}
          </span>
          <div className="w-full mt-2">
            <div
              className="w-full h-1.5 rounded-full relative"
              style={{
                background: "linear-gradient(90deg, #2b6f77 0%, #143625 35%, #588157 55%, #d9822b 78%, #b42318 100%)",
              }}
            >
              <div
                className="absolute -top-[5px] w-4 h-4 rounded-full bg-surface-lowest border-3 border-on-surface -translate-x-1/2 shadow-xs transition-all duration-400"
                style={{
                  left: `${bmiInfo ? Math.min(Math.max(((bmiInfo.bmi - 15) / 25) * 100, 0), 100) : 50}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 font-mono text-[10px] text-outline">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>
        </div>

        {/* ROW 3: Goals & Calorie Target */}
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
          <h3 className="font-headline text-[15px] font-bold text-on-surface flex items-center gap-2.5 pb-3 border-b border-surface-container">
            <svg className="text-primary" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Orientasi Target Dietetika
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: "lose" as const,
                label: "Reduksi Massa",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                    <polyline points="16 17 22 17 22 11" />
                  </svg>
                ),
                desc: "Defisit −500 kkal/hari",
              },
              {
                value: "maintain" as const,
                label: "Pemeliharaan",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="M7 21h10" />
                    <path d="M12 3v18" />
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                  </svg>
                ),
                desc: "Ekuilibrium TDEE",
              },
              {
                value: "gain" as const,
                label: "Surplus Anabolik",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
                desc: "Surplus +500 kkal/hari",
              },
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                className={`flex flex-col items-start gap-2 p-4 rounded-md border cursor-pointer transition-all text-left ${
                  profile.goal === g.value
                    ? "border-primary bg-surface-lowest ring-2 ring-primary/10"
                    : "border-surface-high bg-surface-low hover:border-outline-variant hover:bg-surface-lowest"
                }`}
                onClick={() => handleChange("goal", g.value)}
              >
                <span className="w-8.5 h-8.5 rounded-[8px] bg-primary/8 text-primary flex items-center justify-center">
                  {g.icon}
                </span>
                <span className="font-headline text-sm font-bold text-on-surface">{g.label}</span>
                <span className="font-mono text-[11px] text-on-surface-variant">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 text-center flex flex-col items-center justify-center gap-2.5">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-outline uppercase">
            ESTIMASI KEBUTUHAN ENERGI (TDEE)
          </span>
          <div className="font-mono text-[34px] font-bold text-primary leading-tight tabular-nums tracking-tight">
            <span className="text-[0.65em] text-on-surface-variant font-medium">{todayCalories} / </span>
            {estimatedCalories ?? "—"}
          </div>
          <span className="font-mono text-xs font-semibold text-outline">kkal / hari</span>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-1.5 max-w-[260px]">
            Dihitung menggunakan persamaan Mifflin-St Jeor berdasarkan antropometri & faktor aktivitas Anda.
          </p>
        </div>

        {/* Save Button Row */}
        <div className="col-span-full flex justify-end mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="py-3 px-7 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md text-sm font-semibold cursor-pointer transition-colors font-body disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan Parameter..." : saved ? "Perubahan Tersimpan" : "Simpan Parameter Profil"}
          </button>
        </div>
      </div>
    </div>
  );
}
