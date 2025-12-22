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
  dietaryPreferences: string;  // Free-text preferences passed to LLM
  breakfastLocation: string;
  lunchLocation: string;
  dinnerLocation: string;
  onboardingCompleted: boolean;
}

export const LOCATIONS = {
  campusone: { id: "campusone", name: "CampusOne Dining Hall" },
  chestnut: { id: "chestnut", name: "Chestnut Residence" },
  newcollege: { id: "newcollege", name: "New College Dining Hall" },
  oakhouse: { id: "oakhouse", name: "Oak House Dining Hall" },
} as const;
