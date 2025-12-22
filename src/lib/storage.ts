import { UserPreferences } from "@/types/menu";
import { DailySuggestion } from "./mealTypes";
import { DEFAULT_PREFERENCES } from "./constants";

const CACHE_KEY = "mealPlannerSuggestionCache";

interface SuggestionCache {
  date: string;
  preferencesHash: string;
  suggestion: DailySuggestion;
}

function hashPreferences(prefs: UserPreferences): string {
  const relevant = {
    targetCalories: prefs.targetCalories,
    targetProtein: prefs.targetProtein,
    dietaryPreferences: prefs.dietaryPreferences,
    breakfastLocation: prefs.breakfastLocation,
    lunchLocation: prefs.lunchLocation,
    dinnerLocation: prefs.dinnerLocation,
  };
  return JSON.stringify(relevant);
}

export function getCachedSuggestion(prefs: UserPreferences): DailySuggestion | null {
  if (typeof window === "undefined") return null;

  const today = new Date().toISOString().split("T")[0];
  const currentHash = hashPreferences(prefs);

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: SuggestionCache = JSON.parse(cached);
    if (parsed.date === today && parsed.preferencesHash === currentHash) {
      return parsed.suggestion;
    }
  } catch {
    return null;
  }

  return null;
}

export function cacheSuggestion(prefs: UserPreferences, suggestion: DailySuggestion): void {
  if (typeof window === "undefined") return;

  const cache: SuggestionCache = {
    date: new Date().toISOString().split("T")[0],
    preferencesHash: hashPreferences(prefs),
    suggestion,
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable
  }
}

export function clearSuggestionCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

export function getStoredPreferences(): UserPreferences | null {
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

export function getStoredPreferencesWithDefaults(): UserPreferences {
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
