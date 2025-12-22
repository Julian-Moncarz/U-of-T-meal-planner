"use client";

import { useState, useRef } from "react";
import { MealSuggestion, SelectedItem } from "@/lib/llmSuggestions";
import { LOCATIONS, MenuItem, UserPreferences } from "@/types/menu";
import SwapModal from "./SwapModal";

type MealType = "breakfast" | "lunch" | "dinner";

interface MealAccordionProps {
  meals: MealSuggestion[];
  locations: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  loading?: boolean;
  preferences?: UserPreferences;
  onSwap?: (mealType: MealType, oldItem: SelectedItem, newItem: MenuItem) => void;
}

const sectionTitles: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

function getLocationName(locationId: string): string {
  const loc = LOCATIONS[locationId as keyof typeof LOCATIONS];
  return loc ? loc.name : locationId;
}

function formatItemDisplay(selected: SelectedItem): string {
  const { item, servings, displayQuantity } = selected;
  if (servings > 1) {
    return `${item.name} — ${displayQuantity}`;
  }
  return item.name;
}

function getCurrentMeal(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  return "dinner";
}

export default function MealAccordion({ meals, locations, loading, preferences, onSwap }: MealAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<MealType>>(() => new Set([getCurrentMeal()]));
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapContext, setSwapContext] = useState<{
    item: SelectedItem;
    mealType: MealType;
    locationId: string;
  } | null>(null);
  const dropdownRefs = useRef<Record<MealType, HTMLDivElement | null>>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const handleItemClick = (item: SelectedItem, mealType: MealType, locationId: string) => {
    if (!preferences || !onSwap) return;
    setSwapContext({ item, mealType, locationId });
    setSwapModalOpen(true);
  };

  const handleSwapConfirm = (newItem: MenuItem) => {
    if (swapContext && onSwap) {
      onSwap(swapContext.mealType, swapContext.item, newItem);
    }
    setSwapModalOpen(false);
    setSwapContext(null);
  };

  const toggleSection = (section: MealType) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];

  // Create a map for easy lookup
  const mealMap = new Map<MealType, MealSuggestion>();
  for (const meal of meals) {
    mealMap.set(meal.meal, meal);
  }
  
  if (loading) {
    return (
      <div className="w-full py-12 text-center">
        <p
          className="text-[17px] text-[#0D0D0D] opacity-50"
          style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
        >
          Loading your meal plan...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {mealTypes.map((mealType) => {
        const meal = mealMap.get(mealType);
        const locationId = locations[mealType];
        const locationName = getLocationName(locationId);
        const items = meal?.items || [];
        const totals = meal?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

        return (
          <div key={mealType}>
            <div className="flex items-baseline py-5 px-1">
              <div className="flex items-baseline gap-1.5">
                <button
                  onClick={() => toggleSection(mealType)}
                  className="text-left transition-opacity duration-200 hover:opacity-70"
                  aria-expanded={openSections.has(mealType)}
                  aria-controls={`${mealType}-content`}
                >
                  <span
                    className="font-serif-italic text-[28px] md:text-[32px] tracking-wide text-[#0D0D0D]"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      fontStyle: "italic",
                      fontWeight: 500,
                    }}
                  >
                    {sectionTitles[mealType]}
                  </span>
                </button>
                <div
                  className="relative"
                  ref={(el) => { dropdownRefs.current[mealType] = el; }}
                >
                  <span
                    className="text-[14px] md:text-[15px] text-[#0D0D0D] opacity-60"
                    style={{
                      fontFamily: "var(--font-lato), Arial, sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    at {locationName}
                  </span>
                </div>
              </div>
            </div>

            <div
              id={`${mealType}-content`}
              className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                gridTemplateRows: openSections.has(mealType) ? "1fr" : "0fr",
              }}
            >
              <div className="overflow-hidden">
                {items.length === 0 ? (
                  <p
                    className="pb-4 pl-5 text-[15px] opacity-50"
                    style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
                  >
                    No items available for this meal
                  </p>
                ) : (
                  <ul
                    className="pb-4 pl-5 space-y-3"
                    style={{
                      fontFamily: "var(--font-lato), Arial, sans-serif",
                      fontWeight: 400,
                      fontSize: "17px",
                      lineHeight: 1.6,
                    }}
                  >
                    {items.map((selected, index) => (
                      <li
                        key={`${selected.item.id}-${index}`}
                        onClick={() => handleItemClick(selected, mealType, locationId)}
                        className={`relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--foreground)] before:opacity-40 ${
                          preferences && onSwap ? "cursor-pointer hover:opacity-70 transition-opacity" : ""
                        }`}
                      >
                        {formatItemDisplay(selected)}
                      </li>
                    ))}
                  </ul>
                )}
                <div
                  className="pb-6 pl-5 text-[15px]"
                  style={{
                    fontFamily: "var(--font-lato), Arial, sans-serif",
                  }}
                >
                  <span className="text-[#0D0D0D] opacity-60">
                    {Math.round(totals.calories)} cal · {Math.round(totals.protein)}g protein
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {swapContext && preferences && (
        <SwapModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSwapContext(null);
          }}
          currentItem={swapContext.item}
          mealType={swapContext.mealType}
          locationId={swapContext.locationId}
          preferences={preferences}
          onSwap={handleSwapConfirm}
        />
      )}
    </div>
  );
}
