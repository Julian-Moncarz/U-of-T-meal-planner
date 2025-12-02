import { BodyStats, ACTIVITY_LEVELS, GOALS } from "@/types/menu";

export interface CalculatedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateMacros(stats: BodyStats): CalculatedMacros {
  // Mifflin-St Jeor formula for BMR
  const weightKg = stats.weight * 0.453592;
  const heightCm = stats.height * 2.54;
  
  let bmr: number;
  if (stats.sex === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * stats.age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * stats.age - 161;
  }
  
  // Apply activity multiplier
  const tdee = bmr * ACTIVITY_LEVELS[stats.activityLevel].multiplier;
  
  // Apply goal adjustment
  const goalConfig = GOALS[stats.goal];
  const targetCalories = Math.round(tdee + goalConfig.calorieAdjustment);
  
  // Calculate protein (1g per lb bodyweight for lose/gain, 0.8g for maintain)
  const targetProtein = Math.round(stats.weight * goalConfig.proteinMultiplier);
  
  // Calculate remaining macros
  // Protein = 4 cal/g, Carbs = 4 cal/g, Fat = 9 cal/g
  const proteinCalories = targetProtein * 4;
  const remainingCalories = targetCalories - proteinCalories;
  
  // Split remaining: 55% carbs, 45% fat
  const carbCalories = remainingCalories * 0.55;
  const fatCalories = remainingCalories * 0.45;
  
  const targetCarbs = Math.round(carbCalories / 4);
  const targetFat = Math.round(fatCalories / 9);
  
  return {
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat,
  };
}

export function getProteinPerMeal(totalProtein: number): number {
  // Distribute across 3 meals
  return Math.round(totalProtein / 3);
}
