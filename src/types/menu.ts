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

export interface BodyStats {
  weight: number;      // lbs
  height: number;      // inches
  age: number;
  sex: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
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
  // New fields for onboarding
  bodyStats?: BodyStats;
  excludedProteins: string[];
  isHalal: boolean;
  likedItemIds: string[];
  dislikedItemIds: string[];
  onboardingCompleted: boolean;
}

export const PROTEINS = [
  "fish",
  "pork",
  "beef",
  "tofu",
  "shellfish",
  "lamb",
] as const;

export const ACTIVITY_LEVELS = {
  sedentary: { label: "Sedentary", description: "Little or no exercise", multiplier: 1.2 },
  light: { label: "Lightly Active", description: "Exercise 1-3 days/week", multiplier: 1.375 },
  moderate: { label: "Moderately Active", description: "Exercise 3-5 days/week", multiplier: 1.55 },
  active: { label: "Active", description: "Exercise 6-7 days/week", multiplier: 1.725 },
  very_active: { label: "Very Active", description: "Hard exercise daily", multiplier: 1.9 },
} as const;

export const GOALS = {
  lose: { label: "Lose Weight", calorieAdjustment: -500, proteinMultiplier: 1.0 },
  maintain: { label: "Maintain Weight", calorieAdjustment: 0, proteinMultiplier: 0.8 },
  gain: { label: "Build Muscle", calorieAdjustment: 300, proteinMultiplier: 1.0 },
} as const;

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
