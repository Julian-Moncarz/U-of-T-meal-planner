"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPreferences,
  LOCATIONS,
  ALLERGENS,
  PROTEINS,
} from "@/types/menu";

const DEFAULT_PREFERENCES: UserPreferences = {
  targetCalories: 2500,
  targetProtein: 150,
  targetCarbs: 300,
  targetFat: 80,
  breakfastLocation: "chestnut",
  lunchLocation: "newcollege",
  dinnerLocation: "chestnut",
  dietaryFilter: "all",
  excludedAllergens: [],
  excludedProteins: [],
  isHalal: false,
  likedItemIds: [],
  dislikedItemIds: [],
  onboardingCompleted: false,
};

function DecorativeCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const rotations = {
    "top-left": "rotate-90",
    "top-right": "rotate-180",
    "bottom-right": "-rotate-90",
    "bottom-left": "",
  };

  return (
    <svg
      className={`absolute w-12 h-12 ${rotations[position]} ${
        position.includes("top") ? "top-1" : "bottom-1"
      } ${position.includes("left") ? "left-1" : "right-1"} z-10`}
      viewBox="2.7 2.7 97.3 97.3"
      fill="#1A1A1A"
    >
      <polygon points="20.4953384,81.6360779 35.0803528,81.6360779 35.0803528,79.5044022 20.4953384,79.5044022 20.4953384,64.9199066 18.3636627,64.9199066 18.3636627,79.5044022 4.8444881,79.5044022 4.8444881,64.9199066 2.7128124,64.9199066 2.7128124,81.6360779 18.3636627,81.6360779 18.3636627,97.2874451 35.0803528,97.2874451 35.0803528,95.1557693 20.4953384,95.1557693" />
      <polygon points="16.0943336,68.2546844 12.6696529,68.2546844 12.6696529,2.7125521 10.5379772,2.7125521 10.5379772,68.2546844 7.1135569,68.2546844 7.1135569,77.235466 16.0943336,77.235466" />
      <polygon points="31.7451191,87.329567 31.7451191,83.9054718 22.7643433,83.9054718 22.7643433,92.8862457 31.7451191,92.8862457 31.7451191,89.4612427 97.2871857,89.4612427 97.2871857,87.329567" />
    </svg>
  );
}

function extractItemName(itemId: string): string {
  const parts = itemId.split("-");
  if (parts.length >= 3) {
    return parts.slice(2).join("-");
  }
  return itemId;
}

function getStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  
  const stored = localStorage.getItem("mealPlannerPreferences");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
  return DEFAULT_PREFERENCES;
}

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences>(() => getStoredPreferences());
  const [mounted, setMounted] = useState(false);

  if (!mounted) {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }

  const handleSave = () => {
    localStorage.setItem("mealPlannerPreferences", JSON.stringify(preferences));
    router.push("/");
  };

  const toggleAllergen = (allergen: string) => {
    setPreferences(prev => ({
      ...prev,
      excludedAllergens: prev.excludedAllergens.includes(allergen)
        ? prev.excludedAllergens.filter(a => a !== allergen)
        : [...prev.excludedAllergens, allergen],
    }));
  };

  const toggleProtein = (protein: string) => {
    setPreferences(prev => ({
      ...prev,
      excludedProteins: prev.excludedProteins.includes(protein)
        ? prev.excludedProteins.filter(p => p !== protein)
        : [...prev.excludedProteins, protein],
    }));
  };

  const removeLikedItem = (itemId: string) => {
    setPreferences(prev => ({
      ...prev,
      likedItemIds: prev.likedItemIds.filter(id => id !== itemId),
    }));
  };

  if (!mounted) {
    return (
      <main className="h-screen w-screen flex items-center justify-center">
        <p className="text-[#0D0D0D] opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen p-4 md:p-6">
      <div className="relative min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] w-full border border-[#1A1A1A] overflow-hidden">
        <DecorativeCorner position="top-left" />
        <DecorativeCorner position="top-right" />
        <DecorativeCorner position="bottom-left" />
        <DecorativeCorner position="bottom-right" />

        <div className="h-full overflow-y-auto px-6 py-8 max-w-lg mx-auto">
          <h1
            className="text-[28px] md:text-[32px] mb-2"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            Settings
          </h1>
          <p
            className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
            style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
          >
            Update your meal planning preferences
          </p>

          {/* Macro Targets */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Daily Targets
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] opacity-60 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Calories</label>
                <input
                  type="number"
                  value={preferences.targetCalories}
                  onChange={e => setPreferences(prev => ({ ...prev, targetCalories: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
              <div>
                <label className="block text-[14px] opacity-60 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Protein (g)</label>
                <input
                  type="number"
                  value={preferences.targetProtein}
                  onChange={e => setPreferences(prev => ({ ...prev, targetProtein: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
            </div>
          </div>

          {/* Dining Locations */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Dining Locations
            </h2>
            <div className="space-y-4">
              {(["breakfast", "lunch", "dinner"] as const).map(meal => (
                <div key={meal}>
                  <label className="block text-[14px] opacity-60 mb-2 capitalize" style={{ fontFamily: "var(--font-lato)" }}>
                    {meal}
                  </label>
                  <select
                    value={preferences[`${meal}Location`]}
                    onChange={e => setPreferences(prev => ({ ...prev, [`${meal}Location`]: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none appearance-none cursor-pointer"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {Object.values(LOCATIONS).map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Dietary Preferences
            </h2>
            
            <div className="mb-6">
              <label className="block text-[14px] opacity-60 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                Diet type
              </label>
              <div className="flex gap-2">
                {(["all", "vegetarian", "vegan"] as const).map(diet => (
                  <button
                    key={diet}
                    onClick={() => setPreferences(prev => ({ ...prev, dietaryFilter: diet }))}
                    className={`flex-1 px-4 py-3 border text-[14px] capitalize transition-colors ${
                      preferences.dietaryFilter === diet
                        ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                        : "border-[#E5E5E5] hover:border-[#1A1A1A]"
                    }`}
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {diet === "all" ? "No Restriction" : diet}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[14px] opacity-60 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                Proteins to avoid
              </label>
              <div className="flex flex-wrap gap-2">
                {PROTEINS.map(protein => (
                  <button
                    key={protein}
                    onClick={() => toggleProtein(protein)}
                    className={`px-4 py-2 border text-[14px] capitalize transition-colors ${
                      preferences.excludedProteins.includes(protein)
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-[#E5E5E5] hover:border-[#1A1A1A]"
                    }`}
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {protein}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[14px] opacity-60 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                Allergens
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map(allergen => (
                  <button
                    key={allergen}
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-4 py-2 border text-[14px] capitalize transition-colors ${
                      preferences.excludedAllergens.includes(allergen)
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-[#E5E5E5] hover:border-[#1A1A1A]"
                    }`}
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreferences(prev => ({ ...prev, isHalal: !prev.isHalal }))}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  preferences.isHalal ? "bg-[#1A1A1A]" : "bg-[#E5E5E5]"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.isHalal ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-[15px]" style={{ fontFamily: "var(--font-lato)" }}>
                Halal only
              </span>
            </div>
          </div>

          {/* Liked Foods */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Liked Foods
            </h2>
            {preferences.likedItemIds.length === 0 ? (
              <p className="text-[14px] opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
                No liked foods yet. Items you keep or swap to will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {preferences.likedItemIds.map(itemId => (
                  <div
                    key={itemId}
                    className="flex items-center justify-between p-3 border border-[#E5E5E5]"
                  >
                    <span className="text-[15px]" style={{ fontFamily: "var(--font-lato)" }}>
                      {extractItemName(itemId)}
                    </span>
                    <button
                      onClick={() => removeLikedItem(itemId)}
                      className="p-1 text-[#0D0D0D] opacity-40 hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-10 pb-8">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 border border-[#E5E5E5] text-[#0D0D0D] text-[15px] hover:border-[#1A1A1A] transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-[15px] hover:bg-[#333] transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
