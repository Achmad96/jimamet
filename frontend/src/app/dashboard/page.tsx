"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    weekly_data: [] as { date: string; calories: number }[]
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
    { name: "Serat", value: 0, target: DEFAULT_FIBER_TARGET, color: "#588157", unit: "g" }
  ];

  const rawMacroSum = prot + carbs + fat;
  const totalMacros = rawMacroSum || 1;
  const nutrientDonut = [
    { name: "Protein", pct: rawMacroSum ? Math.round((prot / totalMacros) * 100) : 0, color: "#c85a32", value: prot },
    { name: "Karbohidrat", pct: rawMacroSum ? Math.round((carbs / totalMacros) * 100) : 0, color: "#d9822b", value: carbs },
    { name: "Lemak", pct: rawMacroSum ? Math.round((fat / totalMacros) * 100) : 0, color: "#2b6f77", value: fat }
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-7">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-container)" strokeWidth="18" />
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
                  className="cursor-pointer transition-all duration-200"
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
              <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--on-surface)" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                {nutrientDonut.find((n) => n.name === hoveredMacro)?.value}g
              </text>
              <text x={cx} y={cy + 16} textAnchor="middle" fill={nutrientDonut.find((n) => n.name === hoveredMacro)?.color} fontSize="11.5" fontWeight="600" fontFamily="Inter, sans-serif">
                {hoveredMacro}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--on-surface)" fontSize="21" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                {cals}
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--outline)" fontSize="11" fontFamily="JetBrains Mono, monospace">
                / {target} kkal
              </text>
            </>
          )}
        </svg>
        <div className="flex flex-col gap-3 min-w-[140px]">
          {nutrientDonut.map((seg) => (
            <div key={seg.name} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-2.5 h-2.5 rounded-[2px] shrink-0" style={{ background: seg.color }} />
              <span className="text-on-surface-variant flex-1">{seg.name}</span>
              <span className="font-mono font-semibold text-on-surface tabular-nums">{seg.pct}%</span>
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
      <svg viewBox={`0 0 ${chartW + 44} ${chartH + 40}`} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1="40" y1={chartH - chartH * pct + 12} x2={chartW + 40} y2={chartH - chartH * pct + 12} stroke="var(--surface-container-high)" strokeWidth="1" />
            <text x="0" y={chartH - chartH * pct + 16} fill="var(--outline)" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}
        <line x1="40" y1={chartH - (target / maxVal) * chartH + 12} x2={chartW + 40} y2={chartH - (target / maxVal) * chartH + 12} stroke="#d9822b" strokeWidth="1.25" strokeDasharray="5 4" />
        {calorieData.map((d, i) => {
          const h = Math.max(d.value > 0 ? 4 : 2, (d.value / maxVal) * chartH);
          const x = 44 + i * (barW + gap);
          const isHovered = hoveredDay === d.day;
          const opacity = hoveredDay && !isHovered ? 0.4 : 1;

          return (
            <g key={d.day} onMouseEnter={() => setHoveredDay(d.day)} onMouseLeave={() => setHoveredDay(null)} className="cursor-pointer transition-opacity duration-150" opacity={opacity}>
              <rect x={x - gap / 2} y="0" width={barW + gap} height={chartH + 30} fill="transparent" />

              <rect x={x} y={chartH - h + 12} width={barW} height={h} rx="4" ry="4" fill={d.value === 0 ? "var(--surface-container-high)" : d.value > d.target ? "#c85a32" : "#1b4332"} className="transition-all duration-300" />

              <text x={x + barW / 2} y={chartH + 30} textAnchor="middle" fill={isHovered ? "var(--on-surface)" : "var(--on-surface-variant)"} fontSize="11.5" fontWeight={isHovered || i === 6 ? "600" : "400"}>
                {d.day}
              </text>
              {d.value > 0 && (
                <text x={x + barW / 2} y={chartH - h + 6} textAnchor="middle" fill="var(--outline)" fontSize="10" fontFamily="JetBrains Mono, monospace" opacity={isHovered ? 0 : 1}>
                  {d.value}
                </text>
              )}

              {isHovered && (
                <g transform={`translate(${x + barW / 2}, ${chartH - h - 12})`}>
                  <rect x="-38" y="-24" width="76" height="22" rx="4" fill="var(--on-surface)" />
                  <polygon points="-5,-2 5,-2 0,4" fill="var(--on-surface)" />
                  <text x="0" y="-9" textAnchor="middle" fill="var(--surface)" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono, monospace">
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-surface-high">
        <div>
          <span className="block font-mono text-[11px] font-semibold tracking-wider text-primary mb-1.5">MONITORING ASUPAN HARIAN</span>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            {greeting}, {user?.full_name?.split(" ")[0] || user?.username || "Pasien"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Ringkasan keseimbangan energi dan makronutrien berdasarkan catatan konsumsi Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-medium text-on-surface-variant px-3.5 py-2 bg-surface-lowest rounded-md border border-surface-high">
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
              year: "numeric"
            })}
          </span>
        </div>
      </div>

      {/* ── 4-Column Clinical Telemetry Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">ENERGI HARI INI</span>
            <span className="font-mono text-[11px] font-semibold text-primary px-2 py-0.5 bg-primary-fixed rounded-sm">{Math.round(calPct)}%</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">{cals.toLocaleString("id-ID")}</span>
            <span className="font-mono text-[11px] text-outline">target {target.toLocaleString("id-ID")} kkal</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-cal" style={{ width: `${calPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">PROTEIN</span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-protein" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">{prot}g</span>
            <span className="font-mono text-[11px] text-outline">target {DEFAULT_PROTEIN_TARGET}g</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-protein" style={{ width: `${protPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">KARBOHIDRAT</span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-carbs" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">{carbs}g</span>
            <span className="font-mono text-[11px] text-outline">target {DEFAULT_CARB_TARGET}g</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-carbs" style={{ width: `${carbPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">LEMAK</span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-fat" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">{fat}g</span>
            <span className="font-mono text-[11px] text-outline">target {DEFAULT_FAT_TARGET}g</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-fat" style={{ width: `${fatPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-surface-lowest border border-surface-high rounded-lg p-6">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-5 pb-3.5 border-b border-surface-container">
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">Tren Asupan Energi (7 Hari)</h3>
              <p className="text-xs text-outline mt-0.5">Perbandingan asupan harian terhadap batas target kalori</p>
            </div>
            <div className="flex items-center gap-3.5 font-mono text-[11px] text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <i className="w-2 h-2 rounded-[2px] inline-block bg-macro-cal" />
                Terkendali
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="w-2 h-2 rounded-[2px] inline-block bg-macro-protein" />
                Melebihi Target
              </span>
            </div>
          </div>
          {renderBarChart()}
        </div>

        <div className="lg:col-span-5 bg-surface-lowest border border-surface-high rounded-lg p-6">
          <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">Proporsi Makronutrien</h3>
              <p className="text-xs text-outline mt-0.5">Rasio distribusi gramasi hari ini</p>
            </div>
          </div>
          {renderDonutChart()}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6">
          <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">Log Konsumsi Hari Ini</h3>
              <p className="text-xs text-outline mt-0.5">{summary.meals.length} entri makanan tercatat</p>
            </div>
            <Link href="/dashboard/food-analysis" className="px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md text-xs font-semibold font-headline no-underline transition-colors">
              + Catat Makanan
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {summary.meals.length === 0 ? (
              <div className="py-9 px-4 text-center bg-surface-low border border-dashed border-surface-high rounded-md">
                <p className="text-[13px] text-on-surface-variant mb-2">Belum ada makanan yang dicatat hari ini.</p>
                <Link href="/dashboard/food-analysis" className="text-xs font-semibold text-primary no-underline hover:underline">
                  Mulai analisis foto atau kamera →
                </Link>
              </div>
            ) : (
              summary.meals.map((meal, i) => (
                <div key={i} className="flex items-center gap-3.5 px-3.5 py-3 rounded-md bg-surface-low border border-transparent hover:border-surface-high hover:bg-surface-container transition-all">
                  <div className="w-9 h-9 rounded-md bg-surface-lowest border border-surface-high text-primary flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-on-surface truncate">{formatFoodLabel(meal.food_name || meal.nama_makanan)}</span>
                    <span className="font-mono text-[11px] text-outline">{formatTime(meal.recorded_at || meal.tanggal)}</span>
                  </div>
                  <span className="font-mono text-[13px] font-semibold text-primary shrink-0 tabular-nums">{meal.calories || meal.kalori} kkal</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6">
          <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">Target Kecukupan Makronutrien</h3>
              <p className="text-xs text-outline mt-0.5">Pencapaian gramasi harian per kategori gizi</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {macroData.map((m) => (
              <div key={m.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-semibold text-on-surface">{m.name}</span>
                  <span className="font-mono text-xs font-semibold text-on-surface tabular-nums">
                    {m.value}
                    {m.unit}{" "}
                    <span className="font-normal text-outline">
                      / {m.target}
                      {m.unit}
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((m.value / m.target) * 100, 100)}%`,
                      background: m.color
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
