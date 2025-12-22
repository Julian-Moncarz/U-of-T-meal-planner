import { UserPreferences } from "@/types/menu";
import { DEFAULT_PREFERENCES } from "./constants";

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
