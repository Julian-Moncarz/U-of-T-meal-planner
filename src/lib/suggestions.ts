import { MenuItem, UserPreferences, MealSuggestion, DailySuggestion, DailyMenu } from "@/types/menu";

// Category classifications
const MAIN_CATEGORIES = [
  "Bowls",
  "Burritos", 
  "Grill",
  "Dinner Entree",
  "Lunch Entree",
  "Breakfast Entree",
  "Pizza and Bake Station",
  "Pan Station",
  "Large Burrito Bowls",
  "Small Burrito Bowls",
  "Express Bowls",
  "Combos",
  "Entree (Selections will vary Daily)",
];

const SIDE_CATEGORIES = [
  "Salad Bar",
  "Soup",
  "Sides and More",
  "Breakfast Cold Pantry",
  "Dessert",
];

// Protein keywords for filtering excluded proteins
const PROTEIN_KEYWORDS: Record<string, string[]> = {
  fish: ["fish", "salmon", "tuna", "cod", "tilapia", "halibut", "trout", "mackerel", "sardine", "anchovy"],
  pork: ["pork", "bacon", "ham", "sausage", "pepperoni", "prosciutto", "chorizo"],
  beef: ["beef", "steak", "burger", "brisket", "meatball"],
  shellfish: ["shrimp", "prawn", "crab", "lobster", "oyster", "clam", "mussel", "scallop", "calamari", "squid"],
  tofu: ["tofu"],
  lamb: ["lamb"],
};

// Volume conversion (grams to cups approximation)
function massToVolume(grams: number, category: string): string {
  let gramsPerCup = 150; // default
  
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes("salad")) {
    gramsPerCup = 50;
  } else if (lowerCat.includes("rice") || lowerCat.includes("grain") || lowerCat.includes("cereal")) {
    gramsPerCup = 180;
  } else if (lowerCat.includes("soup")) {
    gramsPerCup = 240;
  }
  
  const cups = grams / gramsPerCup;
  if (cups < 0.3) return "~1/4 cup";
  if (cups < 0.6) return "~1/2 cup";
  if (cups < 0.9) return "~3/4 cup";
  if (cups < 1.3) return "~1 cup";
  if (cups < 1.7) return "~1.5 cups";
  if (cups < 2.3) return "~2 cups";
  return `~${Math.round(cups)} cups`;
}

export function formatServingSize(item: MenuItem, servings: number): string {
  const servingSize = item.servingSize.toLowerCase();
  
  // If it's a discrete unit (each, slice, piece), just show count
  if (servingSize.includes("each") || servingSize.includes("slice") || servingSize.includes("piece")) {
    return servings === 1 ? "1" : `${servings}x`;
  }
  
  // Parse mass from serving size (e.g., "100g" -> 100)
  const massMatch = item.servingSize.match(/(\d+)\s*g/i);
  if (massMatch) {
    const gramsPerServing = parseInt(massMatch[1]);
    const totalGrams = gramsPerServing * servings;
    const volumeStr = massToVolume(totalGrams, item.category);
    return `${totalGrams}g (${volumeStr})`;
  }
  
  // Fallback
  return servings === 1 ? item.servingSize : `${servings}x ${item.servingSize}`;
}

interface MealTargets {
  calories: number;
  protein: number;
}

function getMealTargets(prefs: UserPreferences, meal: "breakfast" | "lunch" | "dinner"): MealTargets {
  const distribution = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.40,
  };
  
  const ratio = distribution[meal];
  
  return {
    calories: Math.round(prefs.targetCalories * ratio),
    protein: Math.round(prefs.targetProtein * ratio),
  };
}

function containsExcludedProtein(itemName: string, excludedProteins: string[]): boolean {
  const lowerName = itemName.toLowerCase();
  
  for (const protein of excludedProteins) {
    const keywords = PROTEIN_KEYWORDS[protein];
    if (keywords && keywords.some(keyword => lowerName.includes(keyword))) {
      return true;
    }
  }
  
  return false;
}

function filterItems(items: MenuItem[], prefs: UserPreferences): MenuItem[] {
  return items.filter(item => {
    // Dietary filter
    if (prefs.dietaryFilter === "vegetarian" && !item.isVegetarian) return false;
    if (prefs.dietaryFilter === "vegan" && !item.isVegan) return false;
    
    // Halal filter
    if (prefs.isHalal && !item.isHalal) return false;
    
    // Allergen filter
    for (const allergen of prefs.excludedAllergens) {
      if (item.allergens.includes(allergen)) return false;
    }
    
    // Excluded proteins filter
    if (containsExcludedProtein(item.name, prefs.excludedProteins)) return false;
    
    return true;
  });
}

function isMainCategory(category: string): boolean {
  return MAIN_CATEGORIES.some(main => 
    category.toLowerCase().includes(main.toLowerCase()) ||
    main.toLowerCase().includes(category.toLowerCase())
  );
}

function isSideCategory(category: string): boolean {
  return SIDE_CATEGORIES.some(side => 
    category.toLowerCase().includes(side.toLowerCase()) ||
    side.toLowerCase().includes(category.toLowerCase())
  );
}

function calculateProteinDensity(item: MenuItem): number {
  if (item.calories === 0) return 0;
  return item.protein / item.calories;
}

export interface SelectedItem {
  item: MenuItem;
  servings: number;
  displayQuantity: string;
}

function selectMealItemsMVP(
  items: MenuItem[],
  targets: MealTargets,
  prefs: UserPreferences
): SelectedItem[] {
  const filteredItems = filterItems(items, prefs);
  
  if (filteredItems.length === 0) return [];
  
  // Separate mains and sides
  const mains = filteredItems.filter(item => isMainCategory(item.category) && item.protein > 0);
  const sides = filteredItems.filter(item => isSideCategory(item.category));
  
  // If no clear mains, use all items with protein as potential mains
  const potentialMains = mains.length > 0 ? mains : filteredItems.filter(i => i.protein > 5);
  
  // Pick main: prefer liked items, fallback to highest protein density
  let selectedMain: MenuItem | null = null;
  
  // First try to find a liked item
  if (prefs.likedItemIds && prefs.likedItemIds.length > 0) {
    for (const likedId of prefs.likedItemIds) {
      const liked = potentialMains.find(item => item.id === likedId);
      if (liked) {
        selectedMain = liked;
        break;
      }
    }
  }
  
  // Fallback to highest protein density
  if (!selectedMain && potentialMains.length > 0) {
    selectedMain = potentialMains.sort((a, b) => calculateProteinDensity(b) - calculateProteinDensity(a))[0];
  }
  
  if (!selectedMain) return [];
  
  // Calculate servings needed to hit ~80% of protein target
  const targetProtein = targets.protein * 0.8;
  const servingsNeeded = selectedMain.protein > 0 
    ? Math.max(1, Math.ceil(targetProtein / selectedMain.protein))
    : 1;
  
  // Cap at reasonable amount (max 4 servings)
  const mainServings = Math.min(servingsNeeded, 4);
  
  const result: SelectedItem[] = [
    {
      item: selectedMain,
      servings: mainServings,
      displayQuantity: formatServingSize(selectedMain, mainServings),
    }
  ];
  
  // Add a side if available
  if (sides.length > 0) {
    // Prefer salad or soup
    const preferredSide = sides.find(s => 
      s.category.toLowerCase().includes("salad") || 
      s.category.toLowerCase().includes("soup")
    ) || sides[0];
    
    result.push({
      item: preferredSide,
      servings: 1,
      displayQuantity: formatServingSize(preferredSide, 1),
    });
  }
  
  return result;
}

function calculateTotalsFromSelected(selected: SelectedItem[]): { calories: number; protein: number; carbs: number; fat: number } {
  return selected.reduce(
    (acc, { item, servings }) => ({
      calories: acc.calories + item.calories * servings,
      protein: acc.protein + item.protein * servings,
      carbs: acc.carbs + item.carbs * servings,
      fat: acc.fat + item.fat * servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export interface MealSuggestionMVP {
  meal: "breakfast" | "lunch" | "dinner";
  items: SelectedItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function generateMealSuggestionMVP(
  menuItems: MenuItem[],
  meal: "breakfast" | "lunch" | "dinner",
  prefs: UserPreferences
): MealSuggestionMVP {
  const targets = getMealTargets(prefs, meal);
  const selectedItems = selectMealItemsMVP(menuItems, targets, prefs);
  const totals = calculateTotalsFromSelected(selectedItems);
  
  return {
    meal,
    items: selectedItems,
    totals,
  };
}

export interface DailySuggestionMVP {
  date: string;
  meals: MealSuggestionMVP[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function generateDailySuggestionMVP(
  menu: DailyMenu,
  prefs: UserPreferences
): DailySuggestionMVP {
  const meals: MealSuggestionMVP[] = [];
  
  const locationMap: Record<string, string> = {
    breakfast: prefs.breakfastLocation,
    lunch: prefs.lunchLocation,
    dinner: prefs.dinnerLocation,
  };
  
  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const locationId = locationMap[mealType];
    const location = menu.locations[locationId];
    
    if (location && location.meals[mealType]) {
      const suggestion = generateMealSuggestionMVP(
        location.meals[mealType],
        mealType,
        prefs
      );
      meals.push(suggestion);
    } else {
      meals.push({
        meal: mealType,
        items: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      });
    }
  }
  
  const dailyTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      carbs: acc.carbs + meal.totals.carbs,
      fat: acc.fat + meal.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  return {
    date: menu.date,
    meals,
    dailyTotals,
  };
}

// Keep old functions for backwards compatibility
export function generateMealSuggestion(
  menuItems: MenuItem[],
  meal: "breakfast" | "lunch" | "dinner",
  prefs: UserPreferences
): MealSuggestion {
  const mvpResult = generateMealSuggestionMVP(menuItems, meal, prefs);
  
  // Convert to old format
  const items: MenuItem[] = [];
  for (const selected of mvpResult.items) {
    for (let i = 0; i < selected.servings; i++) {
      items.push(selected.item);
    }
  }
  
  return {
    meal,
    items,
    totals: mvpResult.totals,
  };
}

export function generateDailySuggestion(
  menu: DailyMenu,
  prefs: UserPreferences
): DailySuggestion {
  const mvpResult = generateDailySuggestionMVP(menu, prefs);
  
  const meals: MealSuggestion[] = mvpResult.meals.map(m => {
    const items: MenuItem[] = [];
    for (const selected of m.items) {
      for (let i = 0; i < selected.servings; i++) {
        items.push(selected.item);
      }
    }
    return {
      meal: m.meal,
      items,
      totals: m.totals,
    };
  });
  
  const proteinShortfall = Math.max(0, prefs.targetProtein - mvpResult.dailyTotals.protein);
  const calorieShortfall = Math.max(0, prefs.targetCalories - mvpResult.dailyTotals.calories);
  
  let shortfallMessage: string | null = null;
  if (proteinShortfall > 20) {
    shortfallMessage = `You're ${Math.round(proteinShortfall)}g protein short. Consider adding a protein shake or extra eggs.`;
  }
  
  return {
    date: mvpResult.date,
    meals,
    dailyTotals: mvpResult.dailyTotals,
    shortfall: {
      protein: proteinShortfall,
      calories: calorieShortfall,
      message: shortfallMessage,
    },
  };
}

export function getHighProteinItems(items: MenuItem[], limit: number = 5): MenuItem[] {
  return [...items]
    .filter(item => item.protein > 0)
    .sort((a, b) => calculateProteinDensity(b) - calculateProteinDensity(a))
    .slice(0, limit);
}
