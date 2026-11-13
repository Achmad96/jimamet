"use client";

import { useState } from "react";
import Image from "next/image";
import { SAMPLE_MEALS } from "@/lib/landing-data";

export function InteractiveMealShowcase() {
  const [activeMealIndex, setActiveMealIndex] = useState(0);
  const currentMeal = SAMPLE_MEALS[activeMealIndex];

  return (
    <div className="flex flex-col gap-8">
      {/* Tab Switcher */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {SAMPLE_MEALS.map((meal, index) => {
          const isActive = index === activeMealIndex;
          return (
            <button
              key={meal.id}
              onClick={() => setActiveMealIndex(index)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold font-headline transition-all cursor-pointer ${
                isActive ? "bg-primary text-on-primary shadow-xs" : "bg-surface-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-high/60 border border-surface-high"
              }`}>
              {meal.name.split(" ")[0]} {meal.name.split(" ")[1] || ""}
            </button>
          );
        })}
      </div>

      {/* Meal Card Preview */}
      <div className="bg-surface-lowest border border-surface-high rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 transition-all">
        {/* Meal Photo */}
        <div className="lg:col-span-5 relative min-h-75 lg:min-h-full bg-surface-container">
          <Image src={currentMeal.image} alt={currentMeal.alt} fill className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" />
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white font-mono text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
            YOLOv8 Deteksi Aktif
          </div>
        </div>

        {/* Meal Details & Nutrition */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h3 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">{currentMeal.name}</h3>
              <span className="font-mono text-xs text-outline bg-surface-low px-3 py-1 rounded-md border border-surface-high">{currentMeal.portion}</span>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">{currentMeal.note}</p>

            {/* Recognized Ingredients / Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {currentMeal.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant text-xs font-medium">
                  ✓ {tag}
                </span>
              ))}
            </div>

            {/* Calories Big Metric */}
            <div className="p-4 rounded-xl bg-surface-low border border-surface-high flex items-baseline justify-between mb-6">
              <div>
                <span className="block font-mono text-[11px] uppercase tracking-wider text-outline mb-0.5">Total Kalori Porsi</span>
                <span className="font-mono text-3xl sm:text-4xl font-bold text-primary tracking-tight">{currentMeal.calories}</span>
                <span className="font-mono text-xs text-outline ml-1.5">kkal</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-primary px-2.5 py-1 rounded-md bg-primary-fixed">{currentMeal.dailyPercent}% Kebutuhan Harian</span>
                <span className="block text-[11px] text-outline mt-1">Standar 2.000 kkal</span>
              </div>
            </div>

            {/* Macronutrient Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-surface-low/80 border border-surface-high">
                <span className="block font-mono text-[10px] text-outline uppercase">Protein</span>
                <span className="font-mono text-lg font-bold text-on-surface">{currentMeal.macros.protein.value}</span>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-protein rounded-full" style={{ width: `${currentMeal.macros.protein.percent}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-low/80 border border-surface-high">
                <span className="block font-mono text-[10px] text-outline uppercase">Karbohidrat</span>
                <span className="font-mono text-lg font-bold text-on-surface">{currentMeal.macros.carbs.value}</span>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-carbs rounded-full" style={{ width: `${currentMeal.macros.carbs.percent}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-low/80 border border-surface-high">
                <span className="block font-mono text-[10px] text-outline uppercase">Lemak</span>
                <span className="font-mono text-lg font-bold text-on-surface">{currentMeal.macros.fat.value}</span>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-fat rounded-full" style={{ width: `${currentMeal.macros.fat.percent}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-low/80 border border-surface-high">
                <span className="block font-mono text-[10px] text-outline uppercase">Serat</span>
                <span className="font-mono text-lg font-bold text-on-surface">{currentMeal.macros.fiber.value}</span>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-macro-fiber rounded-full" style={{ width: `${currentMeal.macros.fiber.percent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
