"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { SAMPLE_MEALS } from "@/lib/landing-data";

export function InteractiveMealShowcase() {
  const [activeMealIndex, setActiveMealIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDetections, setShowDetections] = useState(true);

  const currentMeal = SAMPLE_MEALS[activeMealIndex];
  const totalMeals = SAMPLE_MEALS.length;

  const nextMeal = useCallback(() => {
    setActiveMealIndex((prev) => (prev + 1) % totalMeals);
  }, [totalMeals]);

  const prevMeal = useCallback(() => {
    setActiveMealIndex((prev) => (prev - 1 + totalMeals) % totalMeals);
  }, [totalMeals]);

  // Auto-play carousel every 5.5s (pauses on user hover or interaction)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextMeal();
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, nextMeal]);

  return (
    <div
      className="flex flex-col gap-4 w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}>
      {/* Top Carousel Navigation Tabs & Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Meal Selection Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {SAMPLE_MEALS.map((meal, index) => {
            const isActive = index === activeMealIndex;
            return (
              <button
                key={meal.id}
                onClick={() => setActiveMealIndex(index)}
                aria-label={`Pilih hidangan ${meal.name}`}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold font-headline transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary shadow-xs ring-2 ring-primary/20 scale-[1.02]"
                    : "bg-surface-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-high/60 border border-surface-high"
                }`}>
                {meal.name.split(" ")[0]} {meal.name.split(" ")[1] || ""}
              </button>
            );
          })}
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMeal}
            aria-label="Hidangan Sebelumnya"
            className="w-8 h-8 rounded-full bg-surface-lowest border border-surface-high text-on-surface hover:bg-surface-low hover:border-outline-variant flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-mono text-xs text-outline px-1.5 font-medium">
            {activeMealIndex + 1}/{totalMeals}
          </span>
          <button
            onClick={nextMeal}
            aria-label="Hidangan Berikutnya"
            className="w-8 h-8 rounded-full bg-surface-lowest border border-surface-high text-on-surface hover:bg-surface-low hover:border-outline-variant flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Meal Card Preview */}
      <div className="bg-surface-lowest border border-surface-high rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
        {/* Meal Photo with AI Detection Overlay */}
        <div className="relative aspect-[16/10] w-full bg-surface-container overflow-hidden group">
          <Image
            key={currentMeal.image}
            src={currentMeal.image}
            alt={currentMeal.alt}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
          />

          {/* Top-Left: YOLOv8 Status Badge */}
          <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-white font-mono text-[11px] sm:text-xs flex items-center gap-1.5 border border-white/10 shadow-sm z-10">
            <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
            <span>YOLOv8 Deteksi Aktif</span>
          </div>

          {/* Top-Right: Toggle Bounding Box Button & Portion */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <button
              onClick={() => setShowDetections(!showDetections)}
              title={showDetections ? "Sembunyikan kotak deteksi AI" : "Tampilkan kotak deteksi AI"}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md transition-all border cursor-pointer ${
                showDetections
                  ? "bg-primary/80 border-primary-fixed-dim/40 text-white"
                  : "bg-black/60 border-white/20 text-white/70 hover:text-white"
              }`}>
              {showDetections ? "AI BBox: ON" : "AI BBox: OFF"}
            </button>
          </div>

          {/* Simulated YOLO Detection Bounding Boxes */}
          {showDetections && currentMeal.detections && (
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300">
              {currentMeal.detections.map((det) => (
                <div
                  key={det.label}
                  className="absolute border border-primary-fixed-dim/80 bg-primary/15 rounded-md shadow-xs animate-in fade-in duration-300"
                  style={{
                    top: `${det.box[0]}%`,
                    left: `${det.box[1]}%`,
                    width: `${det.box[2]}%`,
                    height: `${det.box[3]}%`,
                  }}>
                  <div className="absolute -top-5 left-0 bg-primary/90 backdrop-blur-xs text-white font-mono text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap shadow-xs border border-primary-fixed-dim/30">
                    <span>{det.label}</span>
                    <span className="text-primary-fixed font-bold">{det.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Arrow Controls over the photo */}
          <button
            onClick={prevMeal}
            aria-label="Foto Sebelumnya"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextMeal}
            aria-label="Foto Berikutnya"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Subtle Bottom Vignette */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Meal Details & Nutrition Dashboard */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* Header Row: Title & Portion */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                {currentMeal.name}
              </h3>
              <span className="font-mono text-[11px] text-outline bg-surface-low px-2 py-0.5 rounded border border-surface-high shrink-0">
                {currentMeal.portion}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-2">
              {currentMeal.note}
            </p>
          </div>

          {/* Detected Ingredients Chips */}
          <div className="flex flex-wrap gap-1.5">
            {currentMeal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium flex items-center gap-1">
                <span className="text-primary text-xs">✓</span>
                <span>{tag}</span>
              </span>
            ))}
          </div>

          {/* Calories & Macronutrient Summary Box */}
          <div className="p-3.5 rounded-xl bg-surface-low border border-surface-high flex flex-col gap-3">
            {/* Calories Metric Row */}
            <div className="flex items-center justify-between pb-2.5 border-b border-surface-container">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-outline">
                  Total Kalori Porsi
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                    {currentMeal.calories}
                  </span>
                  <span className="font-mono text-xs text-outline">kkal</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary-fixed border border-primary-fixed-dim/30">
                  {currentMeal.dailyPercent}% Kebutuhan Harian
                </span>
                <span className="block text-[10px] text-outline mt-0.5">Standar 2.000 kkal / hari</span>
              </div>
            </div>

            {/* Macronutrient 4-Column Bar Cards */}
            <div className="grid grid-cols-4 gap-2">
              {/* Protein */}
              <div className="p-2 rounded-lg bg-surface-lowest border border-surface-high flex flex-col justify-between">
                <div>
                  <span className="block font-mono text-[9px] text-outline uppercase truncate">Protein</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-on-surface">{currentMeal.macros.protein.value}</span>
                </div>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-protein rounded-full" style={{ width: `${Math.min(currentMeal.macros.protein.percent, 100)}%` }} />
                </div>
              </div>

              {/* Karbohidrat */}
              <div className="p-2 rounded-lg bg-surface-lowest border border-surface-high flex flex-col justify-between">
                <div>
                  <span className="block font-mono text-[9px] text-outline uppercase truncate">Karbo</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-on-surface">{currentMeal.macros.carbs.value}</span>
                </div>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-carbs rounded-full" style={{ width: `${Math.min(currentMeal.macros.carbs.percent, 100)}%` }} />
                </div>
              </div>

              {/* Lemak */}
              <div className="p-2 rounded-lg bg-surface-lowest border border-surface-high flex flex-col justify-between">
                <div>
                  <span className="block font-mono text-[9px] text-outline uppercase truncate">Lemak</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-on-surface">{currentMeal.macros.fat.value}</span>
                </div>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-fat rounded-full" style={{ width: `${Math.min(currentMeal.macros.fat.percent, 100)}%` }} />
                </div>
              </div>

              {/* Serat */}
              <div className="p-2 rounded-lg bg-surface-lowest border border-surface-high flex flex-col justify-between">
                <div>
                  <span className="block font-mono text-[9px] text-outline uppercase truncate">Serat</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-on-surface">{currentMeal.macros.fiber.value}</span>
                </div>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-fiber rounded-full" style={{ width: `${Math.min(currentMeal.macros.fiber.percent, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Slide Progress Bars */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {SAMPLE_MEALS.map((meal, index) => (
              <button
                key={meal.id}
                onClick={() => setActiveMealIndex(index)}
                aria-label={`Lihat hidangan ${index + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  index === activeMealIndex ? "w-7 bg-primary" : "w-2 bg-surface-high hover:bg-outline-variant"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
