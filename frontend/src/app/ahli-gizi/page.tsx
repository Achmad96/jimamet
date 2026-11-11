"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./ahli-gizi.module.css";
import { apiGetMe } from "@/lib/api";

export default function AhliGiziDashboard() {
  const [user, setUser] = useState<{ full_name?: string; spesialisasi?: string } | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    apiGetMe().then(({ ok, data }) => {
      if (ok) setUser(data);
    });
    setToday(new Date().toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }));
  }, []);

  let firstName = "Ahli Gizi";
  if (user?.full_name) {
    const parts = user.full_name.split(" ");
    firstName = parts.length > 1 && parts[0].toLowerCase().includes("dr") ? `${parts[0]} ${parts[1]}` : parts[0];
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className={styles.headerKicker}>PORTAL SPESIALIS GIZI KLINIK</span>
            <h1>Selamat Bertugas, {firstName}</h1>
            <p>Manajemen rujukan pasien dan supervisi telemetri dietetika Jimamet.</p>
          </div>
          {today && (
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--on-surface-variant)",
              background: "var(--surface-container-lowest)",
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--surface-container-high)"
            }}>
              {today}
            </span>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 24 }}>
        <div className={styles.sectionHeader}>
          <h2>Modul Supervisi Klinis</h2>
        </div>
        <div className={styles.actionGrid}>
          <Link href="/ahli-gizi/pasien" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <span className="material-symbols-outlined">medical_services</span>
            </div>
            <div>
              <div className={styles.actionTitle}>Antrean Konsultasi Pasien</div>
              <div className={styles.actionDesc}>Tinjau eskalasi dari NutriCoach AI, inspeksi log asupan harian, dan berikan intervensi gizi langsung.</div>
            </div>
          </Link>
          <div className={styles.actionCard} style={{ cursor: "default", opacity: 0.65 }}>
            <div className={styles.actionIcon}>
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <div className={styles.actionTitle}>Agregasi Populasi Klinis (Segera)</div>
              <div className={styles.actionDesc}>Evaluasi distribusi makronutrisi dan kepatuhan kalori kohort pasien secara berkala.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
