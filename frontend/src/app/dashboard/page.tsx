"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { apiDashboardSummary, apiGetMe } from "@/lib/api";
import { SkeletonDashboard } from "@/components/Skeleton";
import { formatFoodLabel } from "@/lib/food-labels";

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Selamat Pagi");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ full_name?: string; username?: string } | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [hoveredMacro, setHoveredMacro] = useState<string | null>(null);

  const [summary, setSummary] = useState({
    total_calories: 0,
    target_calories: 2000,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    meals: [] as any[],
    weekly_data: [] as { date: string; calories: number }[],
  });

  useEffect(() => {
    apiGetMe().then(({ ok, data }) => {
      if (ok) setUser(data);
    });

    const h = new Date().getHours();
    if (h >= 5 && h < 11) setGreeting("Selamat Pagi");
    else if (h >= 11 && h < 15) setGreeting("Selamat Siang");
    else if (h >= 15 && h < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    apiDashboardSummary().then((res) => {
      if (res.ok) {
        setSummary(res.data);
      }
      setLoading(false);
    });
  }, []);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const DEFAULT_CALORIE_TARGET = 2000;
  const DEFAULT_PROTEIN_TARGET = 60;
  const DEFAULT_CARB_TARGET = 200;
  const DEFAULT_FAT_TARGET = 60;
  const DEFAULT_FIBER_TARGET = 25;

  const target = summary.target_calories || DEFAULT_CALORIE_TARGET;
  const cals = summary.total_calories || 0;
  const calPct = Math.min((cals / target) * 100, 100);

  const prot = Number(summary.total_protein) || 0;
  const protPct = Math.min((prot / DEFAULT_PROTEIN_TARGET) * 100, 100);

  const carbs = Number(summary.total_carbs) || 0;
  const carbPct = Math.min((carbs / DEFAULT_CARB_TARGET) * 100, 100);

  const fat = Number(summary.total_fat) || 0;
  const fatPct = Math.min((fat / DEFAULT_FAT_TARGET) * 100, 100);

  const macroData = [
    { name: "Protein", value: prot, target: DEFAULT_PROTEIN_TARGET, color: "#c85a32", unit: "g" },
    { name: "Karbohidrat", value: carbs, target: DEFAULT_CARB_TARGET, color: "#d9822b", unit: "g" },
    { name: "Lemak", value: fat, target: DEFAULT_FAT_TARGET, color: "#2b6f77", unit: "g" },
    { name: "Serat", value: 0, target: DEFAULT_FIBER_TARGET, color: "#588157", unit: "g" },
  ];

  const rawMacroSum = prot + carbs + fat;
  const totalMacros = rawMacroSum || 1;
  const nutrientDonut = [
    { name: "Protein", pct: rawMacroSum ? Math.round((prot / totalMacros) * 100) : 0, color: "#c85a32", value: prot },
    { name: "Karbohidrat", pct: rawMacroSum ? Math.round((carbs / totalMacros) * 100) : 0, color: "#d9822b", value: carbs },
    { name: "Lemak", pct: rawMacroSum ? Math.round((fat / totalMacros) * 100) : 0, color: "#2b6f77", value: fat },
  ];

  const calorieData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    const isoDate = localDate.toISOString().split("T")[0];

    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });

    const apiDay = summary.weekly_data?.find((w) => w.date === isoDate);
    const val = apiDay ? apiDay.calories : 0;

    if (i === 6) {
      return { day: "Hari Ini", value: cals, target: target };
    }
    return { day: dayName, value: val, target: target };
  });

  function renderDonutChart() {
    const size = 164,
      cx = size / 2,
      cy = size / 2,
      r = 60;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return (
      <div className={styles.donutWrapper}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--surface-container)"
            strokeWidth="18"
          />
          {rawMacroSum > 0 &&
            nutrientDonut.map((seg) => {
              const dash = (seg.pct / 100) * circumference;
              const isHovered = hoveredMacro === seg.name;
              const opacity = hoveredMacro && !isHovered ? 0.35 : 1;
              const currentStroke = isHovered ? "21" : "18";

              const el = (
                <circle
                  key={seg.name}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={currentStroke}
                  strokeDasharray={`${Math.max(0, dash - 3)} ${circumference}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  className={styles.donutSegment}
                  style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  opacity={opacity}
                  onMouseEnter={() => setHoveredMacro(seg.name)}
                  onMouseLeave={() => setHoveredMacro(null)}
                />
              );
              offset += dash;
              return el;
            })}

          {hoveredMacro ? (
            <>
              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                fill="var(--on-surface)"
                fontSize="22"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {nutrientDonut.find((n) => n.name === hoveredMacro)?.value}g
              </text>
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                fill={nutrientDonut.find((n) => n.name === hoveredMacro)?.color}
                fontSize="11.5"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                {hoveredMacro}
              </text>
            </>
          ) : (
            <>
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fill="var(--on-surface)"
                fontSize="21"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {cals}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fill="var(--outline)"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                / {target} kkal
              </text>
            </>
          )}
        </svg>
        <div className={styles.donutLegend}>
          {nutrientDonut.map((seg) => (
            <div key={seg.name} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: seg.color }} />
              <span className={styles.legendLabel}>{seg.name}</span>
              <span className={styles.legendValue}>{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderBarChart() {
    const highestVal = Math.max(...calorieData.map((d) => d.value), target);
    const maxVal = Math.max(2000, Math.ceil((highestVal + 200) / 500) * 500);

    const barW = 36,
      gap = 20,
      chartH = 180;
    const chartW = calorieData.length * (barW + gap);

    return (
      <svg viewBox={`0 0 ${chartW + 44} ${chartH + 40}`} className={styles.chartSvg}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line
              x1="40"
              y1={chartH - chartH * pct + 12}
              x2={chartW + 40}
              y2={chartH - chartH * pct + 12}
              stroke="var(--surface-container-high)"
              strokeWidth="1"
            />
            <text
              x="0"
              y={chartH - chartH * pct + 16}
              fill="var(--outline)"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}
        <line
          x1="40"
          y1={chartH - (target / maxVal) * chartH + 12}
          x2={chartW + 40}
          y2={chartH - (target / maxVal) * chartH + 12}
          stroke="#d9822b"
          strokeWidth="1.25"
          strokeDasharray="5 4"
        />
        {calorieData.map((d, i) => {
          const h = Math.max(d.value > 0 ? 4 : 2, (d.value / maxVal) * chartH);
          const x = 44 + i * (barW + gap);
          const isHovered = hoveredDay === d.day;
          const opacity = hoveredDay && !isHovered ? 0.4 : 1;

          return (
            <g
              key={d.day}
              onMouseEnter={() => setHoveredDay(d.day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
              opacity={opacity}
            >
              <rect x={x - gap / 2} y="0" width={barW + gap} height={chartH + 30} fill="transparent" />

              <rect
                x={x}
                y={chartH - h + 12}
                width={barW}
                height={h}
                rx="4"
                ry="4"
                fill={
                  d.value === 0
                    ? "var(--surface-container-high)"
                    : d.value > d.target
                    ? "#c85a32"
                    : "#1b4332"
                }
                className={styles.bar}
              />

              <text
                x={x + barW / 2}
                y={chartH + 30}
                textAnchor="middle"
                fill={isHovered ? "var(--on-surface)" : "var(--on-surface-variant)"}
                fontSize="11.5"
                fontWeight={isHovered || i === 6 ? "600" : "400"}
              >
                {d.day}
              </text>
              {d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={chartH - h + 6}
                  textAnchor="middle"
                  fill="var(--outline)"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  opacity={isHovered ? 0 : 1}
                >
                  {d.value}
                </text>
              )}

              {isHovered && (
                <g transform={`translate(${x + barW / 2}, ${chartH - h - 12})`}>
                  <rect x="-38" y="-24" width="76" height="22" rx="4" fill="var(--on-surface)" />
                  <polygon points="-5,-2 5,-2 0,4" fill="var(--on-surface)" />
                  <text
                    x="0"
                    y="-9"
                    textAnchor="middle"
                    fill="var(--surface)"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {d.value} kkal
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  if (loading) return <SkeletonDashboard />;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <span className={styles.headerKicker}>TELEMETRI ASUPAN HARIAN</span>
          <h1 className={styles.greeting}>
            {greeting}, {user?.full_name?.split(" ")[0] || user?.username || "Pasien"}
          </h1>
          <p className={styles.subtitle}>
            Ringkasan keseimbangan energi dan makronutrien berdasarkan catatan konsumsi Anda.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.dateBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* ── 4-Column Clinical Telemetry Strip ── */}
      <div className={styles.statCards}>
        <div className={styles.statCard}>
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>ENERGI HARI INI</span>
            <span className={styles.statPctBadge}>{Math.round(calPct)}%</span>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{cals.toLocaleString("id-ID")}</span>
            <span className={styles.statMeta}>target {target.toLocaleString("id-ID")} kkal</span>
          </div>
          <div className={styles.statProgress}>
            <div style={{ width: `${calPct}%`, background: "var(--macro-cal)" }} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>PROTEIN</span>
            <span className={styles.statDot} style={{ background: "var(--macro-protein)" }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{prot}g</span>
            <span className={styles.statMeta}>target {DEFAULT_PROTEIN_TARGET}g</span>
          </div>
          <div className={styles.statProgress}>
            <div style={{ width: `${protPct}%`, background: "var(--macro-protein)" }} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>KARBOHIDRAT</span>
            <span className={styles.statDot} style={{ background: "var(--macro-carbs)" }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{carbs}g</span>
            <span className={styles.statMeta}>target {DEFAULT_CARB_TARGET}g</span>
          </div>
          <div className={styles.statProgress}>
            <div style={{ width: `${carbPct}%`, background: "var(--macro-carbs)" }} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>LEMAK</span>
            <span className={styles.statDot} style={{ background: "var(--macro-fat)" }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{fat}g</span>
            <span className={styles.statMeta}>target {DEFAULT_FAT_TARGET}g</span>
          </div>
          <div className={styles.statProgress}>
            <div style={{ width: `${fatPct}%`, background: "var(--macro-fat)" }} />
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3>Tren Asupan Energi (7 Hari)</h3>
              <p>Perbandingan asupan harian terhadap batas target kalori</p>
            </div>
            <div className={styles.chartLegendInline}>
              <span>
                <i className={styles.legendDotInline} style={{ background: "#1b4332" }} />
                Terkendali
              </span>
              <span>
                <i className={styles.legendDotInline} style={{ background: "#c85a32" }} />
                Melebihi Target
              </span>
            </div>
          </div>
          {renderBarChart()}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3>Proporsi Makronutrien</h3>
              <p>Rasio distribusi gramasi hari ini</p>
            </div>
          </div>
          {renderDonutChart()}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className={styles.bottomRow}>
        <div className={styles.mealsCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3>Log Konsumsi Hari Ini</h3>
              <p>{summary.meals.length} entri makanan tercatat</p>
            </div>
            <Link href="/dashboard/food-analysis" className={styles.addBtn}>
              + Catat Makanan
            </Link>
          </div>
          <div className={styles.mealsList}>
            {summary.meals.length === 0 ? (
              <div className={styles.emptyMeals}>
                <p>Belum ada makanan yang dicatat hari ini.</p>
                <Link href="/dashboard/food-analysis" className={styles.emptyMealsLink}>
                  Mulai analisis foto atau kamera →
                </Link>
              </div>
            ) : (
              summary.meals.map((meal, i) => (
                <div key={i} className={styles.mealItem}>
                  <div className={styles.mealIconBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div className={styles.mealInfo}>
                    <span className={styles.mealName}>
                      {formatFoodLabel(meal.food_name || meal.nama_makanan)}
                    </span>
                    <span className={styles.mealTime}>
                      {formatTime(meal.recorded_at || meal.tanggal)}
                    </span>
                  </div>
                  <span className={styles.mealCal}>{meal.calories || meal.kalori} kkal</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.macroCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3>Target Kecukupan Makronutrien</h3>
              <p>Pencapaian gramasi harian per kategori gizi</p>
            </div>
          </div>
          <div className={styles.macroList}>
            {macroData.map((m) => (
              <div key={m.name} className={styles.macroItem}>
                <div className={styles.macroTop}>
                  <span className={styles.macroName}>{m.name}</span>
                  <span className={styles.macroValue}>
                    {m.value}
                    {m.unit}{" "}
                    <span className={styles.macroTarget}>
                      / {m.target}
                      {m.unit}
                    </span>
                  </span>
                </div>
                <div className={styles.macroTrack}>
                  <div
                    className={styles.macroFill}
                    style={{
                      width: `${Math.min((m.value / m.target) * 100, 100)}%`,
                      background: m.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
