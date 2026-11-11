"use client";

import { useState, useEffect } from "react";
import styles from "./profile.module.css";
import { apiGetProfile, apiUpdateProfile, apiDashboardSummary } from "@/lib/api";
import { SkeletonProfile } from "@/components/Skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    username: "",
    age: "",
    weight: "",
    height: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain"
  });
  const [todayCalories, setTodayCalories] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGetProfile(), apiDashboardSummary()]).then(([profRes, sumRes]) => {
      if (profRes.ok && profRes.data) {
        setProfile({
          fullName: profRes.data.full_name || "",
          email: profRes.data.email || "",
          username: profRes.data.username || "",
          age: profRes.data.age?.toString() || "",
          weight: profRes.data.weight?.toString() || "",
          height: profRes.data.height?.toString() || "",
          gender: profRes.data.gender || "male",
          activityLevel: profRes.data.activity_level || "moderate",
          goal: profRes.data.goal || "maintain"
        });
      }
      if (sumRes.ok && sumRes.data) {
        setTodayCalories(sumRes.data.total_calories || 0);
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { ok, data } = await apiUpdateProfile({
      full_name: profile.fullName,
      age: profile.age ? parseInt(profile.age) : null,
      weight: profile.weight ? parseFloat(profile.weight) : null,
      height: profile.height ? parseFloat(profile.height) : null,
      gender: profile.gender,
      activity_level: profile.activityLevel,
      goal: profile.goal
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert(data?.error || "Gagal menyimpan profil. Periksa koneksi atau backend.");
      console.error("Profile update failed:", data);
    }
  };

  // BMI
  const bmi = profile.weight && profile.height ? (parseFloat(profile.weight) / (parseFloat(profile.height) / 100) ** 2).toFixed(1) : "—";

  const bmiCategory = () => {
    const v = parseFloat(bmi);
    if (isNaN(v)) return { label: "Belum Terkalkulasi", color: "#6f7771" };
    if (v < 18.5) return { label: "Underweight (Kurus)", color: "#2b6f77" };
    if (v < 25) return { label: "Normal (Ideal)", color: "#143625" };
    if (v < 30) return { label: "Overweight", color: "#d9822b" };
    return { label: "Obesitas", color: "#b42318" };
  };

  // Estimated daily calories
  const estimateCalories = () => {
    const w = parseFloat(profile.weight),
      h = parseFloat(profile.height),
      a = parseFloat(profile.age);
    if (!w || !h || !a) return "—";
    const bmr = profile.gender === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const factors: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
    const tdee = bmr * (factors[profile.activityLevel] || 1.55);
    if (profile.goal === "lose") return Math.round(tdee - 400);
    if (profile.goal === "gain") return Math.round(tdee + 400);
    return Math.round(tdee);
  };

  if (loading) return <SkeletonProfile />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.headerKicker}>PARAMETER ANTROPOMETRI & TARGET</span>
          <h1 className={styles.title}>Kelola Profil Klinis</h1>
          <p className={styles.subtitle}>Konfigurasi metrik fisiologis untuk kalibrasi kebutuhan energi harian (TDEE).</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* ROW 1: Personal Info & Avatar */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Identitas Pengguna
          </h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>Nama Lengkap</label>
              <input type="text" value={profile.fullName} onChange={(e) => handleChange("fullName", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={profile.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Username</label>
              <input type="text" value={profile.username} onChange={(e) => handleChange("username", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Usia</label>
              <div className={styles.inputUnit}>
                <input type="number" value={profile.age} onChange={(e) => handleChange("age", e.target.value)} />
                <span>thn</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.avatarCard}>
          <div className={styles.avatarBig}>
            <span>{(profile.fullName || "P").charAt(0).toUpperCase()}</span>
          </div>
          <h3>{profile.fullName || "Pengguna"}</h3>
          <p>@{profile.username || "user"}</p>
          <span className={styles.avatarBadge}>AKUN PASIEN AKTIF</span>
        </div>

        {/* ROW 2: Body Metrics & BMI */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Parameter Antropometri
          </h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>Berat Badan</label>
              <div className={styles.inputUnit}>
                <input type="number" value={profile.weight} onChange={(e) => handleChange("weight", e.target.value)} />
                <span>kg</span>
              </div>
            </div>
            <div className={styles.field}>
              <label>Tinggi Badan</label>
              <div className={styles.inputUnit}>
                <input type="number" value={profile.height} onChange={(e) => handleChange("height", e.target.value)} />
                <span>cm</span>
              </div>
            </div>
            <div className={styles.field}>
              <label>Jenis Kelamin Biologis</label>
              <select value={profile.gender} onChange={(e) => handleChange("gender", e.target.value)}>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Faktor Aktivitas Fisik (PAL)</label>
              <select value={profile.activityLevel} onChange={(e) => handleChange("activityLevel", e.target.value)}>
                <option value="sedentary">Sedentari (minim gerak)</option>
                <option value="light">Ringan (1–3x latihan/minggu)</option>
                <option value="moderate">Moderat (3–5x latihan/minggu)</option>
                <option value="active">Aktif (6–7x latihan/minggu)</option>
                <option value="veryActive">Sangat Aktif (intensitas tinggi)</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.bmiCard}>
          <span className={styles.sideCardKicker}>INDEKS MASSA TUBUH (IMT / BMI)</span>
          <div className={styles.bmiValue} style={{ color: bmiCategory().color }}>
            {bmi}
          </div>
          <span className={styles.bmiLabel} style={{ background: `${bmiCategory().color}14`, color: bmiCategory().color }}>
            {bmiCategory().label}
          </span>
          <div className={styles.bmiScale}>
            <div className={styles.bmiBar}>
              <div className={styles.bmiIndicator} style={{ left: `${isNaN(parseFloat(bmi)) ? 50 : Math.min(Math.max(((parseFloat(bmi) - 15) / 25) * 100, 0), 100)}%` }} />
            </div>
            <div className={styles.bmiLabels}>
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>
        </div>

        {/* ROW 3: Goals & Calorie Target */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Orientasi Target Dietetika
          </h3>
          <div className={styles.goalOptions}>
            {[
              {
                value: "lose",
                label: "Reduksi Massa",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                    <polyline points="16 17 22 17 22 11" />
                  </svg>
                ),
                desc: "Defisit −400 kkal/hari"
              },
              {
                value: "maintain",
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
                desc: "Ekuilibrium TDEE"
              },
              {
                value: "gain",
                label: "Surplus Anabolik",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
                desc: "Surplus +400 kkal/hari"
              }
            ].map((g) => (
              <button key={g.value} type="button" className={`${styles.goalCard} ${profile.goal === g.value ? styles.goalCardActive : ""}`} onClick={() => handleChange("goal", g.value)}>
                <span className={styles.goalIcon}>{g.icon}</span>
                <span className={styles.goalLabel}>{g.label}</span>
                <span className={styles.goalDesc}>{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.calorieCard}>
          <span className={styles.sideCardKicker}>ESTIMASI KEBUTUHAN ENERGI (TDEE)</span>
          <div className={styles.calorieValue}>
            <span className={styles.calorieCurrent}>{todayCalories} / </span>
            {estimateCalories()}
          </div>
          <span className={styles.calorieUnit}>kkal / hari</span>
          <p className={styles.calorieNote}>Dihitung menggunakan persamaan Mifflin-St Jeor berdasarkan antropometri & faktor aktivitas Anda.</p>
        </div>

        {/* Save Button Row */}
        <div className={styles.saveBar}>
          <button onClick={handleSave} className={styles.saveBtn} disabled={saving}>
            {saving ? "Menyimpan Parameter..." : saved ? "Perubahan Tersimpan" : "Simpan Parameter Profil"}
          </button>
        </div>
      </div>
    </div>
  );
}
