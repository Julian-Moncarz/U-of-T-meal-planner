"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MealAccordion from "@/components/MealAccordion";
import { DecorativeCorner } from "@/components/DecorativeCorner";
import { UserPreferences } from "@/types/menu";
import { DailySuggestion } from "@/lib/mealTypes";
import { getStoredPreferences } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (prefs: UserPreferences) => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, preferences: prefs }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "locations_closed") {
          setError(`Your selected dining halls are closed today. Available: ${data.availableLocations.join(", ")}. Update in Settings.`);
        } else {
          setError(data.message || "Failed to load meal plan");
        }
        return;
      }

      setSuggestion(data as DailySuggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Check onboarding and load preferences
  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored || !stored.onboardingCompleted) {
      router.push("/onboarding");
      return;
    }
    setPreferences(stored);
  }, [router]);

  // Fetch suggestions on initial load
  useEffect(() => {
    if (preferences && !suggestion && !error) {
      fetchSuggestions(preferences);
    }
  }, [preferences, suggestion, error]);

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
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/settings")}
                  className="px-6 py-2 bg-[#1A1A1A] text-white text-[14px] hover:bg-[#333] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Settings
                </button>
                <button
                  onClick={() => fetchSuggestions(preferences)}
                  className="px-6 py-2 border border-[#1A1A1A] text-[14px] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <MealAccordion
              key={suggestion?.meals.map(m => m.items.map(i => i.item.id).join(',')).join('|') || 'empty'}
              meals={suggestion?.meals || []}
              locations={{
                breakfast: preferences.breakfastLocation,
                lunch: preferences.lunchLocation,
                dinner: preferences.dinnerLocation,
              }}
              loading={loading}
            />
          )}

          {/* Daily totals and preferences link */}
          {suggestion && !loading && (
            <div className="mt-8 pt-6 border-t border-[#E5E5E5] text-center">
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {Math.round(suggestion.dailyTotals.calories)} calories, {Math.round(suggestion.dailyTotals.protein)}g protein
              </p>
              <button
                onClick={() => router.push("/settings")}
                className="mt-3 text-[13px] text-[#0D0D0D] opacity-40 hover:opacity-70 transition-opacity inline-flex items-center gap-1.5"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
