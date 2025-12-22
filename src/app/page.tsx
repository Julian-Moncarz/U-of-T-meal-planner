"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MealAccordion from "@/components/MealAccordion";
import { UserPreferences, MenuItem } from "@/types/menu";
import { DailySuggestion, SelectedItem, formatServingSize } from "@/lib/llmSuggestions";

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
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = (
    mealType: "breakfast" | "lunch" | "dinner",
    oldItem: SelectedItem,
    newItem: MenuItem
  ) => {
    if (!suggestion || !preferences) return;

    // Create updated meals with the swapped item
    const updatedMeals = suggestion.meals.map((meal) => {
      if (meal.meal !== mealType) {
        return { ...meal, items: [...meal.items], totals: { ...meal.totals } };
      }
      
      const updatedItems = meal.items.map((item) => {
        // Match by item name (more reliable than ID which changes daily)
        if (item.item.name === oldItem.item.name) {
          return {
            item: { ...newItem },
            servings: 1,
            displayQuantity: formatServingSize(newItem, 1),
          };
        }
        return { ...item, item: { ...item.item } };
      });
      
      const newTotals = updatedItems.reduce(
        (acc, { item, servings }) => ({
          calories: acc.calories + item.calories * servings,
          protein: acc.protein + item.protein * servings,
          carbs: acc.carbs + item.carbs * servings,
          fat: acc.fat + item.fat * servings,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      
      return { ...meal, meal: meal.meal, items: updatedItems, totals: newTotals };
    });
    
    const newDailyTotals = updatedMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totals.calories,
        protein: acc.protein + meal.totals.protein,
        carbs: acc.carbs + meal.totals.carbs,
        fat: acc.fat + meal.totals.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Set new suggestion object
    const newSuggestion: DailySuggestion = {
      date: suggestion.date,
      meals: updatedMeals,
      dailyTotals: newDailyTotals,
    };
    
    setSuggestion(newSuggestion);

    // Update preferences with liked item
    const updatedPrefs = {
      ...preferences,
      likedItemIds: preferences.likedItemIds.includes(newItem.id)
        ? preferences.likedItemIds
        : [...preferences.likedItemIds, newItem.id],
    };
    setPreferences(updatedPrefs);
    localStorage.setItem("mealPlannerPreferences", JSON.stringify(updatedPrefs));
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

  // Fetch suggestions only on initial load (not when preferences update for likes)
  const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
  
  useEffect(() => {
    if (!preferences || hasFetchedSuggestions) return;

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
        setSuggestion(data as DailySuggestion);
        setHasFetchedSuggestions(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [preferences, hasFetchedSuggestions]);

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
        <button
          onClick={() => router.push("/settings")}
          className="absolute top-4 right-4 p-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors z-20"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
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
              key={suggestion?.meals.map(m => m.items.map(i => i.item.id).join(',')).join('|') || 'empty'}
              meals={suggestion?.meals || []}
              locations={{
                breakfast: preferences.breakfastLocation,
                lunch: preferences.lunchLocation,
                dinner: preferences.dinnerLocation,
              }}
              loading={loading}
              preferences={preferences}
              onSwap={handleSwap}
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
