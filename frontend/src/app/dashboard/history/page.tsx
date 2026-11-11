"use client";

import { useState, useEffect } from "react";
import styles from "./history.module.css";
import { apiListFoodRecords } from "@/lib/api";
import { SkeletonHistory } from "@/components/Skeleton";
import { formatFoodLabel } from "@/lib/food-labels";

interface MealRecord {
  id: string;
  date: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string | null;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const todayFormatted = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  return dateStr === todayFormatted;
}

function isThisWeek(dateStr: string): boolean {
  const parts = dateStr.split(" ");
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const d = new Date(parseInt(parts[2]), months.indexOf(parts[1]), parseInt(parts[0]));
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allData, setAllData] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListFoodRecords().then(({ ok, data }) => {
      if (ok && Array.isArray(data) && data.length > 0) {
        const mapped: MealRecord[] = data.map((r: Record<string, unknown>) => {
          // Extract image URL from joined images table
          const images = r.images as Record<string, unknown> | null;
          const imageUrl = images?.file_path as string | null;

          return {
            id: (r.id_analysis as string) || (r.id as string) || Math.random().toString(),
            date: formatDate((r.tanggal as string) || (r.recorded_at as string)),
            time: formatTime((r.tanggal as string) || (r.recorded_at as string)),
            name: formatFoodLabel((r.nama_makanan as string) || (r.food_name as string) || "Makanan"),
            calories: (r.kalori as number) || (r.calories as number) || 0,
            protein: (r.protein as number) || 0,
            carbs: (r.karbohidrat as number) || (r.carbs as number) || 0,
            fat: (r.lemak as number) || (r.fat as number) || 0,
            imageUrl: imageUrl || null,
          };
        });
        setAllData(mapped);
      }
      setLoading(false);
    });
  }, []);

  const filteredData = allData.filter((item) => {
    const itemName = item.name || "";
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "today") return matchesSearch && isToday(item.date);
    if (filter === "week") return matchesSearch && isThisWeek(item.date);
    return matchesSearch;
  });

  const grouped = filteredData.reduce<Record<string, MealRecord[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const totalCal = filteredData.reduce((s, i) => s + i.calories, 0);
  const totalProtein = filteredData.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = filteredData.reduce((s, i) => s + i.carbs, 0);
  const totalFat = filteredData.reduce((s, i) => s + i.fat, 0);

  if (loading) return <SkeletonHistory />;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.headerKicker}>REKAM JEJAK DIETETIKA</span>
          <h1 className={styles.title}>Histori Konsumsi</h1>
          <p className={styles.subtitle}>Buku besar kronologis asupan energi dan makronutrisi harian Anda.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Total Kalori</span>
            <span className={styles.summaryIndicator} style={{ background: "var(--macro-cal)" }} />
          </div>
          <div className={styles.summaryMetric}>
            <span className={styles.summaryValue}>{totalCal.toLocaleString()}</span>
            <span className={styles.summaryUnit}>kkal</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Protein</span>
            <span className={styles.summaryIndicator} style={{ background: "var(--macro-protein)" }} />
          </div>
          <div className={styles.summaryMetric}>
            <span className={styles.summaryValue}>{totalProtein}</span>
            <span className={styles.summaryUnit}>gram</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Karbohidrat</span>
            <span className={styles.summaryIndicator} style={{ background: "var(--macro-carbs)" }} />
          </div>
          <div className={styles.summaryMetric}>
            <span className={styles.summaryValue}>{totalCarbs}</span>
            <span className={styles.summaryUnit}>gram</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Lemak</span>
            <span className={styles.summaryIndicator} style={{ background: "var(--macro-fat)" }} />
          </div>
          <div className={styles.summaryMetric}>
            <span className={styles.summaryValue}>{totalFat}</span>
            <span className={styles.summaryUnit}>gram</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {(["all", "today", "week"] as const).map((f) => (
            <button key={f} className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "Semua Riwayat" : f === "today" ? "Hari Ini" : "7 Hari Terakhir"}
            </button>
          ))}
        </div>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Cari spesimen makanan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
        </div>
      </div>

      {/* History List */}
      <div className={styles.historyList}>
        {Object.entries(grouped).map(([date, meals]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateHeader}>
              <span className={styles.dateBadge}>{date}</span>
              <span className={styles.dateCal}>{meals.reduce((s, m) => s + m.calories, 0).toLocaleString()} kkal</span>
            </div>
            <div className={styles.mealsTable}>
              {meals.map((meal) => (
                <div key={meal.id} className={styles.mealRow}>
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt={meal.name} className={styles.mealImage} />
                  ) : (
                    <div className={styles.mealIconBox}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                    </div>
                  )}
                  <div className={styles.mealInfo}>
                    <span className={styles.mealName}>{meal.name}</span>
                    <span className={styles.mealTime}>{meal.time}</span>
                  </div>
                  <div className={styles.mealNutrients}>
                    <span className={styles.nutrientPill} style={{ background: "rgba(200, 90, 50, 0.1)", color: "var(--macro-protein)" }}>
                      P {meal.protein}g
                    </span>
                    <span className={styles.nutrientPill} style={{ background: "rgba(217, 130, 43, 0.1)", color: "var(--macro-carbs)" }}>
                      K {meal.carbs}g
                    </span>
                    <span className={styles.nutrientPill} style={{ background: "rgba(43, 111, 119, 0.1)", color: "var(--macro-fat)" }}>
                      L {meal.fat}g
                    </span>
                  </div>
                  <span className={styles.mealCal}>{meal.calories} kkal</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className={styles.emptyState}>
            <p>Tidak ada rekaman konsumsi yang sesuai dengan filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
