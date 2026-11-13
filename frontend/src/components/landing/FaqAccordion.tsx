"use client";

import { useState } from "react";
import { FAQS } from "@/lib/landing-data";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col gap-3">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.q} className="border border-surface-high rounded-xl bg-surface-lowest overflow-hidden transition-colors">
            <button onClick={() => toggle(index)} className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer">
              <span className="font-headline text-base sm:text-lg font-bold text-on-surface">{faq.q}</span>
              <span className="w-8 h-8 rounded-full bg-surface-low border border-surface-high flex items-center justify-center shrink-0 text-on-surface-variant transition-transform">
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            {isOpen && <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base leading-relaxed text-on-surface-variant border-t border-surface-container pt-3">{faq.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
