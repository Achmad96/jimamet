"use client";

import { useReducer, useMemo, useCallback, useRef, useEffect } from "react";
import { apiUpdateProfile } from "@/lib/api";
import { calculateBMI, calculateBMR, calculateTDEE, ProfileData } from "@/lib/profile-utils";
import { ProfileIdentityCard } from "./ProfileIdentityCard";
import { ProfileAvatarCard } from "./ProfileAvatarCard";
import { ProfileBodyMetricsCard } from "./ProfileBodyMetricsCard";
import { ProfileBmiCard } from "./ProfileBmiCard";
import { ProfileActivityGoalCard } from "./ProfileActivityGoalCard";
import { ProfileCalorieBudgetCard } from "./ProfileCalorieBudgetCard";

interface ProfileFormProps {
  initialProfile: ProfileData;
  todayCalories: number;
}

const fieldInputClass = "w-full py-2.5 px-3.5 border border-surface-high rounded-md font-body text-sm text-on-surface bg-surface-low outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-3 focus:ring-primary/10";

interface FormState {
  profile: ProfileData;
  saved: boolean;
  saving: boolean;
}

type FormAction = { type: "UPDATE_FIELD"; field: keyof ProfileData; value: string } | { type: "START_SAVING" } | { type: "SAVE_SUCCESS" } | { type: "SAVE_ERROR" } | { type: "RESET_SAVED" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        profile: { ...state.profile, [action.field]: action.value },
        saved: false
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
    saving: false
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
      goal: profile.goal
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

  const bmiInfo = useMemo(() => calculateBMI(weightNum, heightNum), [weightNum, heightNum]);
  const bmr = useMemo(() => calculateBMR(weightNum, heightNum, ageNum, profile.gender), [weightNum, heightNum, ageNum, profile.gender]);
  const estimatedCalories = useMemo(() => (bmr ? calculateTDEE(bmr, profile.activityLevel, profile.goal) : null), [bmr, profile.activityLevel, profile.goal]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end pb-4 border-b border-surface-high">
        <div>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">Kelola Profil Klinis</h1>
          <p className="text-sm text-on-surface-variant mt-1">Konfigurasi metrik fisiologis untuk kalibrasi kebutuhan energi harian (TDEE).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-stretch">
        {/* ROW 1: Personal Info & Avatar */}
        <ProfileIdentityCard profile={profile} fieldInputClass={fieldInputClass} onChange={handleChange} />
        <ProfileAvatarCard fullName={profile.fullName} username={profile.username} />

        {/* ROW 2: Body Metrics & BMI */}
        <ProfileBodyMetricsCard profile={profile} fieldInputClass={fieldInputClass} onChange={handleChange} />
        <ProfileBmiCard bmiInfo={bmiInfo} />

        {/* ROW 3: Activity & Goals */}
        <ProfileActivityGoalCard profile={profile} fieldInputClass={fieldInputClass} onChange={handleChange} />
        <ProfileCalorieBudgetCard estimatedCalories={estimatedCalories} todayCalories={todayCalories} />
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-high">
        {saved && <span className="font-mono text-xs font-semibold text-primary">✓ Perubahan berhasil disimpan</span>}
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 py-2.5 px-6 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
