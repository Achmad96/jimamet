"use client";

import { useState, useMemo, useCallback } from "react";
import {
  buildWeeklyCalorieData,
  buildNutrientDonutSegments,
} from "@/lib/dashboard-utils";

interface DashboardChartsProps {
  weeklyData: Array<{ date: string; calories: number }>;
  todayCalories: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function DashboardCharts({
  weeklyData,
  todayCalories,
  targetCalories,
  protein,
  carbs,
  fat,
}: DashboardChartsProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [hoveredMacro, setHoveredMacro] = useState<string | null>(null);

  const calorieData = useMemo(
    () => buildWeeklyCalorieData(weeklyData, todayCalories, targetCalories),
    [weeklyData, todayCalories, targetCalories]
  );

  const { rawSum: rawMacroSum, segments: nutrientDonut } = useMemo(
    () => buildNutrientDonutSegments(protein, carbs, fat),
    [protein, carbs, fat]
  );

  const handleDayEnter = useCallback((date: string) => {
    setHoveredDay(date);
  }, []);

  const handleDayLeave = useCallback(() => {
    setHoveredDay(null);
  }, []);

  const handleMacroEnter = useCallback((macroName: string) => {
    setHoveredMacro(macroName);
  }, []);

  const handleMacroLeave = useCallback(() => {
    setHoveredMacro(null);
  }, []);

  function renderDonutChart() {
    const size = 164;
    const cx = size / 2;
    const cy = size / 2;
    const r = 60;
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
                  onMouseEnter={() => handleMacroEnter(seg.name)}
                  onMouseLeave={handleMacroLeave}
                />
              );
              offset += dash;
              return el;
            })}

          {hoveredMacro ? (
            <>
              <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--on-surface)" fontSize="22" fontWeight="700" fontFamily="Space Mono, monospace">
                {nutrientDonut.find((n) => n.name === hoveredMacro)?.value}g
              </text>
              <text x={cx} y={cy + 16} textAnchor="middle" fill={nutrientDonut.find((n) => n.name === hoveredMacro)?.color} fontSize="11.5" fontWeight="600" fontFamily="DM Sans, sans-serif">
                {hoveredMacro}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--on-surface)" fontSize="21" fontWeight="700" fontFamily="Space Mono, monospace">
                {todayCalories}
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--outline)" fontSize="11" fontFamily="Space Mono, monospace">
                / {targetCalories} kkal
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
    const highestVal = Math.max(...calorieData.map((d) => d.value), targetCalories);
    const maxVal = Math.max(2000, Math.ceil((highestVal + 200) / 500) * 500);

    const barW = 36;
    const gap = 20;
    const chartH = 180;
    const chartW = calorieData.length * (barW + gap);

    return (
      <svg viewBox={`0 0 ${chartW + 44} ${chartH + 40}`} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1="40" y1={chartH - chartH * pct + 12} x2={chartW + 40} y2={chartH - chartH * pct + 12} stroke="var(--surface-container-high)" strokeWidth="1" />
            <text x="0" y={chartH - chartH * pct + 16} fill="var(--outline)" fontSize="10" fontFamily="Space Mono, monospace">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}
        <line x1="40" y1={chartH - (targetCalories / maxVal) * chartH + 12} x2={chartW + 40} y2={chartH - (targetCalories / maxVal) * chartH + 12} stroke="#d9822b" strokeWidth="1.25" strokeDasharray="5 4" />
        {calorieData.map((d, i) => {
          const h = Math.max(d.value > 0 ? 4 : 2, (d.value / maxVal) * chartH);
          const x = 44 + i * (barW + gap);
          const isHovered = hoveredDay === d.day;
          const opacity = hoveredDay && !isHovered ? 0.4 : 1;

          return (
            <g key={d.day} onMouseEnter={() => handleDayEnter(d.day)} onMouseLeave={handleDayLeave} className="cursor-pointer transition-opacity duration-150" opacity={opacity}>
              <rect x={x - gap / 2} y="0" width={barW + gap} height={chartH + 30} fill="transparent" />

              <rect
                x={x}
                y={chartH - h + 12}
                width={barW}
                height={h}
                rx="4"
                ry="4"
                fill={d.value === 0 ? "var(--surface-container-high)" : d.value > d.target ? "#c85a32" : "#1b4332"}
                className="transition-all duration-300"
              />

              <text x={x + barW / 2} y={chartH + 30} textAnchor="middle" fill={isHovered ? "var(--on-surface)" : "var(--on-surface-variant)"} fontSize="11.5" fontWeight={isHovered || i === 6 ? "600" : "400"}>
                {d.day}
              </text>
              {d.value > 0 && (
                <text x={x + barW / 2} y={chartH - h + 6} textAnchor="middle" fill="var(--outline)" fontSize="10" fontFamily="Space Mono, monospace" opacity={isHovered ? 0 : 1}>
                  {d.value}
                </text>
              )}

              {isHovered && (
                <g transform={`translate(${x + barW / 2}, ${chartH - h - 12})`}>
                  <rect x="-38" y="-24" width="76" height="22" rx="4" fill="var(--on-surface)" />
                  <polygon points="-5,-2 5,-2 0,4" fill="var(--on-surface)" />
                  <text x="0" y="-9" textAnchor="middle" fill="var(--surface)" fontSize="11" fontWeight="600" fontFamily="Space Mono, monospace">
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

  return (
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
  );
}
