"use client";

import { useState, useEffect } from "react";
import { MenuItem, UserPreferences } from "@/types/menu";
import { SelectedItem } from "@/lib/llmSuggestions";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: SelectedItem;
  mealType: "breakfast" | "lunch" | "dinner";
  locationId: string;
  preferences: UserPreferences;
  onSwap: (newItem: MenuItem) => void;
}

export default function SwapModal({
  isOpen,
  onClose,
  currentItem,
  mealType,
  locationId,
  preferences,
  onSwap,
}: SwapModalProps) {
  const [alternatives, setAlternatives] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAlt(null);
      return;
    }

    const fetchAlternatives = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch("/api/swap-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: today,
            mealType,
            locationId,
            currentItemId: currentItem.item.id,
            preferences,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAlternatives(data.alternatives || []);
        }
      } catch (err) {
        console.error("Failed to fetch alternatives:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlternatives();
  }, [isOpen, mealType, locationId, currentItem.item.id, preferences]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedAlt) {
      onSwap(selectedAlt);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAFAF8] rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E5E5E5]">
          <div className="flex justify-between items-start">
            <div>
              <p
                className="text-[13px] text-[#0D0D0D] opacity-50 mb-1"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Swap out
              </p>
              <h3
                className="text-[20px] font-medium text-[#0D0D0D]"
                style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }}
              >
                {currentItem.item.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 text-[#0D0D0D] opacity-50 hover:opacity-100"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p
              className="text-center py-8 text-[15px] text-[#0D0D0D] opacity-50"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Loading options...
            </p>
          ) : alternatives.length === 0 ? (
            <p
              className="text-center py-8 text-[15px] text-[#0D0D0D] opacity-50"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              No alternatives available
            </p>
          ) : (
            <ul className="space-y-2">
              {alternatives.map((alt, index) => (
                <li key={`${alt.id}-${index}`}>
                  <button
                    onClick={() => setSelectedAlt(alt)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedAlt?.id === alt.id
                        ? "border-[#0D0D0D] bg-[#0D0D0D]/5"
                        : "border-[#E5E5E5] hover:border-[#CCCCCC]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <p
                          className="text-[16px] text-[#0D0D0D]"
                          style={{ fontFamily: "var(--font-lato)" }}
                        >
                          {alt.name}
                        </p>
                        <p
                          className="text-[13px] text-[#0D0D0D] opacity-50 mt-0.5"
                          style={{ fontFamily: "var(--font-lato)" }}
                        >
                          {alt.servingSize}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[14px] text-[#0D0D0D]"
                          style={{ fontFamily: "var(--font-lato)" }}
                        >
                          {alt.calories} cal
                        </p>
                        <p
                          className="text-[13px] text-[#0D0D0D] opacity-50"
                          style={{ fontFamily: "var(--font-lato)" }}
                        >
                          {alt.protein}g protein
                        </p>
                      </div>
                    </div>
                    {(alt.isVegan || alt.isVegetarian) && (
                      <div className="mt-2 flex gap-2">
                        {alt.isVegan && (
                          <span className="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            Vegan
                          </span>
                        )}
                        {alt.isVegetarian && !alt.isVegan && (
                          <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            Vegetarian
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E5E5E5]">
          <button
            onClick={handleConfirm}
            disabled={!selectedAlt}
            className={`w-full py-3 rounded-lg text-[15px] font-medium transition-colors ${
              selectedAlt
                ? "bg-[#0D0D0D] text-white hover:bg-[#2A2A2A]"
                : "bg-[#E5E5E5] text-[#999999] cursor-not-allowed"
            }`}
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
}
