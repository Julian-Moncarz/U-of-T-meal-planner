"use client";

import { useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner";

interface MealData {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

interface MealAccordionProps {
  meals: MealData;
}

const sectionTitles: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function MealAccordion({ meals }: MealAccordionProps) {
  const [openSection, setOpenSection] = useState<MealType | null>(null);

  const toggleSection = (section: MealType) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections: MealType[] = ["breakfast", "lunch", "dinner"];

  return (
    <div className="w-full">
      {sections.map((section) => (
        <div key={section} className="border-b border-[var(--border-color)]">
          <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between py-5 px-1 text-left transition-colors duration-200 hover:opacity-70"
            aria-expanded={openSection === section}
            aria-controls={`${section}-content`}
          >
            <span
              className="font-serif-italic text-[28px] md:text-[32px] tracking-wide"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              {sectionTitles[section]}
            </span>
            <svg
              className={`w-5 h-5 transition-transform duration-300 ease-in-out ${
                openSection === section ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            id={`${section}-content`}
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openSection === section
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <ul
              className="pb-6 pl-5 space-y-3"
              style={{
                fontFamily: "var(--font-lato), Arial, sans-serif",
                fontWeight: 400,
                fontSize: "17px",
                lineHeight: 1.6,
              }}
            >
              {meals[section].map((item, index) => (
                <li
                  key={index}
                  className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--foreground)] before:opacity-40"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
