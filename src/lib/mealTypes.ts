import { MenuItem } from "@/types/menu";

// ============================================================================
// Types
// ============================================================================

export interface SelectedItem {
  item: MenuItem;
  servings: number;
  displayQuantity: string;
}

export interface MealSuggestion {
  meal: "breakfast" | "lunch" | "dinner";
  items: SelectedItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DailySuggestion {
  date: string;
  meals: MealSuggestion[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// ============================================================================
// Shared Utilities
// ============================================================================

export function formatServingSize(item: MenuItem, servings: number): string {
  const servingSize = item.servingSize.toLowerCase();

  if (servingSize.includes("each") || servingSize.includes("slice") || servingSize.includes("piece")) {
    return servings === 1 ? "1" : `${servings}x`;
  }

  const massMatch = item.servingSize.match(/(\d+)\s*g/i);
  if (massMatch) {
    const gramsPerServing = parseInt(massMatch[1]);
    const totalGrams = gramsPerServing * servings;
    const volumeStr = massToVolume(totalGrams, item.category);
    return `${totalGrams}g (${volumeStr})`;
  }

  return servings === 1 ? item.servingSize : `${servings}x ${item.servingSize}`;
}

function massToVolume(grams: number, category: string): string {
  let gramsPerCup = 150;
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes("salad")) gramsPerCup = 50;
  else if (lowerCat.includes("rice") || lowerCat.includes("grain") || lowerCat.includes("cereal")) gramsPerCup = 180;
  else if (lowerCat.includes("soup")) gramsPerCup = 240;

  const cups = grams / gramsPerCup;
  if (cups < 0.3) return "~1/4 cup";
  if (cups < 0.6) return "~1/2 cup";
  if (cups < 0.9) return "~3/4 cup";
  if (cups < 1.3) return "~1 cup";
  if (cups < 1.7) return "~1.5 cups";
  if (cups < 2.3) return "~2 cups";
  return `~${Math.round(cups)} cups`;
}
