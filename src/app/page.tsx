"use client";

import { useState, useEffect, useCallback } from "react";
import { MacroInputGroup } from "@/components/MacroInput";
import { LocationSelectorGroup } from "@/components/LocationSelector";
import { DietaryFilters } from "@/components/DietaryFilters";
import { DayPicker } from "@/components/DayPicker";
import { MealPlan } from "@/components/MealPlan";
import { UserPreferences, DailySuggestion } from "@/types/menu";

const DEFAULT_PREFERENCES: UserPreferences = {
  targetCalories: 2800,
  targetProtein: 160,
  targetCarbs: 350,
  targetFat: 90,
  breakfastLocation: "chestnut",
  lunchLocation: "newcollege",
  dinnerLocation: "chestnut",
  dietaryFilter: "all",
  excludedAllergens: [],
};

function getStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  
  const stored = localStorage.getItem("mealPlannerPreferences");
  if (stored) {
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
  return DEFAULT_PREFERENCES;
}

export default function Home() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreferences(getStoredPreferences());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mealPlannerPreferences", JSON.stringify(preferences));
    }
  }, [preferences]);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, preferences }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate meal plan");
      }
      
      const data = await response.json();
      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, preferences]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold">UofT Meal Planner</h1>
          <p className="text-blue-200 mt-1">Hit your macros with campus dining</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <MacroInputGroup
              calories={preferences.targetCalories}
              protein={preferences.targetProtein}
              carbs={preferences.targetCarbs}
              fat={preferences.targetFat}
              onCaloriesChange={(v) => updatePreference("targetCalories", v)}
              onProteinChange={(v) => updatePreference("targetProtein", v)}
              onCarbsChange={(v) => updatePreference("targetCarbs", v)}
              onFatChange={(v) => updatePreference("targetFat", v)}
            />

            <LocationSelectorGroup
              breakfastLocation={preferences.breakfastLocation}
              lunchLocation={preferences.lunchLocation}
              dinnerLocation={preferences.dinnerLocation}
              onBreakfastChange={(v) => updatePreference("breakfastLocation", v)}
              onLunchChange={(v) => updatePreference("lunchLocation", v)}
              onDinnerChange={(v) => updatePreference("dinnerLocation", v)}
            />

            <DietaryFilters
              dietaryFilter={preferences.dietaryFilter}
              excludedAllergens={preferences.excludedAllergens}
              onDietaryFilterChange={(v) => updatePreference("dietaryFilter", v)}
              onAllergensChange={(v) => updatePreference("excludedAllergens", v)}
            />

            <button
              onClick={generatePlan}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Meal Plan"}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <DayPicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <MealPlan
              suggestion={suggestion}
              targets={{
                calories: preferences.targetCalories,
                protein: preferences.targetProtein,
                carbs: preferences.targetCarbs,
                fat: preferences.targetFat,
              }}
              loading={loading}
            />
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 border-t py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Data sourced from UofT Food Services. Menu items and nutritional info may vary.</p>
          <p className="mt-1">Not affiliated with the University of Toronto.</p>
        </div>
      </footer>
    </div>
  );
}
