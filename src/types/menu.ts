export interface MenuItem {
  id: string;
  name: string;
  category: string;
  location: string;
  meal: "breakfast" | "lunch" | "dinner";
  date: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  allergens: string[];
}

export interface DailyMenu {
  date: string;
  locations: {
    [locationId: string]: {
      name: string;
      meals: {
        [meal: string]: MenuItem[];
      };
    };
  };
}

export interface UserPreferences {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  breakfastLocation: string;
  lunchLocation: string;
  dinnerLocation: string;
  dietaryFilter: "all" | "vegetarian" | "vegan";
  excludedAllergens: string[];
}

export interface MealSuggestion {
  meal: "breakfast" | "lunch" | "dinner";
  items: MenuItem[];
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
  shortfall: {
    protein: number;
    calories: number;
    message: string | null;
  };
}

export const LOCATIONS = {
  campusone: { id: "campusone", name: "CampusOne Dining Hall" },
  chestnut: { id: "chestnut", name: "Chestnut Residence" },
  newcollege: { id: "newcollege", name: "New College Dining Hall" },
  oakhouse: { id: "oakhouse", name: "Oak House Dining Hall" },
  robarts: { id: "robarts", name: "Robarts Cafeteria" },
} as const;

export const ALLERGENS = [
  "gluten",
  "sesame", 
  "soy",
  "peanuts",
  "mustard",
  "milk",
  "shellfish",
  "fish",
  "egg",
  "treenuts",
  "sulphites",
  "wheat",
] as const;
