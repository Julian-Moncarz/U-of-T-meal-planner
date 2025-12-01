import { MenuItem, UserPreferences, MealSuggestion, DailySuggestion, DailyMenu } from "@/types/menu";

interface MealTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function getMealTargets(prefs: UserPreferences, meal: "breakfast" | "lunch" | "dinner"): MealTargets {
  // Distribute macros across meals: breakfast 25%, lunch 35%, dinner 40%
  const distribution = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.40,
  };
  
  const ratio = distribution[meal];
  
  return {
    calories: Math.round(prefs.targetCalories * ratio),
    protein: Math.round(prefs.targetProtein * ratio),
    carbs: Math.round(prefs.targetCarbs * ratio),
    fat: Math.round(prefs.targetFat * ratio),
  };
}

function filterItems(items: MenuItem[], prefs: UserPreferences): MenuItem[] {
  return items.filter(item => {
    // Dietary filter
    if (prefs.dietaryFilter === "vegetarian" && !item.isVegetarian) return false;
    if (prefs.dietaryFilter === "vegan" && !item.isVegan) return false;
    
    // Allergen filter
    for (const allergen of prefs.excludedAllergens) {
      if (item.allergens.includes(allergen)) return false;
    }
    
    return true;
  });
}

function calculateProteinDensity(item: MenuItem): number {
  if (item.calories === 0) return 0;
  return item.protein / item.calories;
}

function selectMealItems(
  items: MenuItem[],
  targets: MealTargets,
  prefs: UserPreferences
): MenuItem[] {
  const filteredItems = filterItems(items, prefs);
  
  if (filteredItems.length === 0) return [];
  
  // Sort by protein density (protein per calorie)
  const sortedByProtein = [...filteredItems].sort(
    (a, b) => calculateProteinDensity(b) - calculateProteinDensity(a)
  );
  
  const selected: MenuItem[] = [];
  let currentCalories = 0;
  let currentProtein = 0;
  
  // First pass: prioritize high-protein items
  for (const item of sortedByProtein) {
    if (currentCalories + item.calories <= targets.calories * 1.1) {
      selected.push(item);
      currentCalories += item.calories;
      currentProtein += item.protein;
      
      // Stop if we've hit ~80% of protein target or calorie target
      if (currentProtein >= targets.protein * 0.8 || currentCalories >= targets.calories * 0.9) {
        break;
      }
    }
  }
  
  // If we haven't hit calorie target, add more items
  if (currentCalories < targets.calories * 0.7) {
    for (const item of filteredItems) {
      if (selected.includes(item)) continue;
      if (currentCalories + item.calories <= targets.calories * 1.1) {
        selected.push(item);
        currentCalories += item.calories;
        
        if (currentCalories >= targets.calories * 0.85) break;
      }
    }
  }
  
  return selected;
}

function calculateTotals(items: MenuItem[]): { calories: number; protein: number; carbs: number; fat: number } {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function generateMealSuggestion(
  menuItems: MenuItem[],
  meal: "breakfast" | "lunch" | "dinner",
  prefs: UserPreferences
): MealSuggestion {
  const targets = getMealTargets(prefs, meal);
  const selectedItems = selectMealItems(menuItems, targets, prefs);
  const totals = calculateTotals(selectedItems);
  
  return {
    meal,
    items: selectedItems,
    totals,
  };
}

export function generateDailySuggestion(
  menu: DailyMenu,
  prefs: UserPreferences
): DailySuggestion {
  const meals: MealSuggestion[] = [];
  
  // Get location mapping
  const locationMap: Record<string, string> = {
    breakfast: prefs.breakfastLocation,
    lunch: prefs.lunchLocation,
    dinner: prefs.dinnerLocation,
  };
  
  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const locationId = locationMap[mealType];
    const location = menu.locations[locationId];
    
    if (location && location.meals[mealType]) {
      const suggestion = generateMealSuggestion(
        location.meals[mealType],
        mealType,
        prefs
      );
      meals.push(suggestion);
    } else {
      // Empty meal if location/meal not found
      meals.push({
        meal: mealType,
        items: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      });
    }
  }
  
  // Calculate daily totals
  const dailyTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      carbs: acc.carbs + meal.totals.carbs,
      fat: acc.fat + meal.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  // Calculate shortfall
  const proteinShortfall = Math.max(0, prefs.targetProtein - dailyTotals.protein);
  const calorieShortfall = Math.max(0, prefs.targetCalories - dailyTotals.calories);
  
  let shortfallMessage: string | null = null;
  if (proteinShortfall > 20) {
    shortfallMessage = `You're ${Math.round(proteinShortfall)}g protein short. Consider adding: `;
    if (proteinShortfall > 40) {
      shortfallMessage += "a protein shake (~25g) and extra portions of eggs, cottage cheese, or Greek yogurt.";
    } else if (proteinShortfall > 20) {
      shortfallMessage += "an extra portion of eggs (8g), cottage cheese (11g), or a protein bar.";
    }
  }
  
  return {
    date: menu.date,
    meals,
    dailyTotals,
    shortfall: {
      protein: proteinShortfall,
      calories: calorieShortfall,
      message: shortfallMessage,
    },
  };
}

export function getHighProteinItems(items: MenuItem[], limit: number = 5): MenuItem[] {
  return [...items]
    .filter(item => item.isVegetarian)
    .sort((a, b) => calculateProteinDensity(b) - calculateProteinDensity(a))
    .slice(0, limit);
}
