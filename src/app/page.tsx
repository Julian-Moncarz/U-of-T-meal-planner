"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MealAccordion from "@/components/MealAccordion";
import { UserPreferences } from "@/types/menu";
import { DailySuggestionMVP } from "@/lib/suggestions";

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

function getStoredPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("mealPlannerPreferences");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return null;
    }
  }
  return null;
}

export default function Home() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [suggestion, setSuggestion] = useState<DailySuggestionMVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check onboarding and load preferences
  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored || !stored.onboardingCompleted) {
      router.push("/onboarding");
      return;
    }
    setPreferences(stored);
  }, [router]);

  // Fetch suggestions when preferences are loaded
  useEffect(() => {
    if (!preferences) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, preferences }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to load meal plan");
        }
        
        const data = await response.json();
        setSuggestion(data as DailySuggestionMVP);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [preferences]);

  // Show nothing while checking onboarding
  if (!preferences) {
    return (
      <main className="h-screen w-screen flex items-center justify-center">
        <p className="text-[#0D0D0D] opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen p-4 md:p-6 overflow-hidden">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 border border-[#1A1A1A]" />
        <DecorativeCorner position="top-left" />
        <DecorativeCorner position="top-right" />
        <DecorativeCorner position="bottom-left" />
        <DecorativeCorner position="bottom-right" />
        <div className="relative h-full overflow-y-auto px-6 py-8 max-w-md mx-auto">
          {error ? (
            <div className="text-center py-12">
              <p
                className="text-[17px] text-red-600 mb-4"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 border border-[#1A1A1A] text-[14px] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Try again
              </button>
            </div>
          ) : (
            <MealAccordion
              meals={suggestion?.meals || []}
              locations={{
                breakfast: preferences.breakfastLocation,
                lunch: preferences.lunchLocation,
                dinner: preferences.dinnerLocation,
              }}
              loading={loading}
            />
          )}
          
          {/* Daily totals */}
          {suggestion && !loading && (
            <div className="mt-8 pt-6 border-t border-[#E5E5E5]">
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 text-center"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Daily total: {Math.round(suggestion.dailyTotals.calories)} cal · {Math.round(suggestion.dailyTotals.protein)}g protein
              </p>
              <p
                className="text-[13px] text-[#0D0D0D] opacity-40 text-center mt-1"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Target: {preferences.targetCalories} cal · {preferences.targetProtein}g protein
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
