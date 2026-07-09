"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqSection as FaqSectionType } from "../data";

export function FAQSectionComponent({ section }: { section: FaqSectionType }) {
  const [openIds, setOpenIds] = useState<string[]>(
    () => section.items.map((item) => `${section.id}-${item.id}`)
  );

  const toggleItem = (itemId: string) => {
    const compositeId = `${section.id}-${itemId}`;
    setOpenIds((current) =>
      current.includes(compositeId)
        ? current.filter((id) => id !== compositeId)
        : [...current, compositeId]
    );
  };

  return (
    <div className="space-y-5">
      <h3 className="text-[24px] md:text-[26px] font-bold font-['Urbanist'] tracking-[-0.02em] text-[#0a0a0a]">
        {section.title}
      </h3>
      <div className="space-y-2.5">
        {section.items.map((item) => {
          const compositeId = `${section.id}-${item.id}`;
          const isOpen = openIds.includes(compositeId);
          const hasAnswer = Boolean(item.answer);

          return (
            <div
              key={item.id}
              className="border-b border-[rgba(0,0,0,0.6)] pb-2"
            >
              <button
                onClick={() => hasAnswer && toggleItem(item.id)}
                className="w-full min-h-11 flex items-center justify-between text-left gap-4 pt-1 py-2"
                aria-expanded={isOpen}
              >
                <span className="text-[16px] md:text-[17px] font-['Poppins'] tracking-[-0.02em] leading-tight text-[#0a0a0a]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#0a0a0a] transition-transform ${
                    isOpen ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </button>

              {hasAnswer ? (
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-[14.5px] text-[#4a5565] font-['Poppins'] leading-relaxed mt-2 pr-8">
                      {item.answer}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
