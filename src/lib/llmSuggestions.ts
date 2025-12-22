"use server";

import Anthropic from "@anthropic-ai/sdk";
import { MenuItem, UserPreferences, DailyMenu } from "@/types/menu";
import type { SelectedItem, MealSuggestion, DailySuggestion } from "./mealTypes";
import { formatServingSize } from "./mealTypes";

const MODEL = "claude-haiku-4-5-20251001";

// ============================================================================
// Location Availability Check
// ============================================================================

export interface ClosedLocation {
  meal: "breakfast" | "lunch" | "dinner";
  locationId: string;
}

export interface LocationAvailability {
  available: boolean;
  closedLocations: ClosedLocation[];
  availableLocations: string[];
}

export async function checkLocationAvailability(
  menu: DailyMenu,
  prefs: UserPreferences
): Promise<LocationAvailability> {
  const closedLocations: ClosedLocation[] = [];
  const availableLocations = new Set<string>();

  // Check each meal's location
  const mealLocations = [
    { meal: "breakfast" as const, locationId: prefs.breakfastLocation },
    { meal: "lunch" as const, locationId: prefs.lunchLocation },
    { meal: "dinner" as const, locationId: prefs.dinnerLocation },
  ];

  for (const { meal, locationId } of mealLocations) {
    const location = menu.locations[locationId];
    const hasItems = location?.meals[meal]?.length > 0;

    if (!hasItems) {
      closedLocations.push({ meal, locationId });
    }
  }

  // Find which locations ARE available
  for (const [locId, location] of Object.entries(menu.locations)) {
    const hasMeals = Object.values(location.meals).some(items => items.length > 0);
    if (hasMeals) {
      availableLocations.add(locId);
    }
  }

  return {
    available: closedLocations.length === 0,
    closedLocations,
    availableLocations: Array.from(availableLocations),
  };
}

let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

// ============================================================================
// LLM Meal Plan Generation
// ============================================================================

interface LLMMenuSelection {
  meal: "breakfast" | "lunch" | "dinner";
  items: Array<{
    itemId: string;
    servings: number;
  }>;
}

interface LLMDailyPlan {
  meals: LLMMenuSelection[];
}

function buildMenuContext(menu: DailyMenu, prefs: UserPreferences): string {
  const locationMap: Record<string, string> = {
    breakfast: prefs.breakfastLocation,
    lunch: prefs.lunchLocation,
    dinner: prefs.dinnerLocation,
  };

  let context = "";

  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const locationId = locationMap[mealType];
    const location = menu.locations[locationId];

    if (!location || !location.meals[mealType]) {
      context += `\n## ${mealType.toUpperCase()} at ${locationId}\nNo items available.\n`;
      continue;
    }

    const items = location.meals[mealType];
    context += `\n## ${mealType.toUpperCase()} at ${location.name}\n`;

    for (const item of items) {
      context += `- ID: "${item.id}" | ${item.name} | `;
      context += `${item.calories}cal, ${item.protein}g protein per ${item.servingSize}\n`;
    }
  }

  return context;
}

function buildPreferencesContext(prefs: UserPreferences): string {
  let context = `
DAILY TARGETS: ${prefs.targetCalories} cal, ${prefs.targetProtein}g protein
MEAL DISTRIBUTION: breakfast 25%, lunch 35%, dinner 40%
`;

  if (prefs.dietaryPreferences && prefs.dietaryPreferences.trim()) {
    context += `\nUSER PREFERENCES: ${prefs.dietaryPreferences}\n`;
  }

  return context;
}

export async function generateMealPlan(
  menu: DailyMenu,
  prefs: UserPreferences,
  userFeedback?: string
): Promise<DailySuggestion> {
  const menuContext = buildMenuContext(menu, prefs);
  const prefsContext = buildPreferencesContext(prefs);

  const systemPrompt = `You are a meal planning assistant for university students. Select items from the menu to create a balanced meal plan.

RULES:
1. ONLY use exact item IDs from the menu - never invent items
2. Select 1-3 items per meal with servings 1-5
3. Prioritize hitting protein targets
4. STRICTLY respect user dietary preferences based on item names. For vegetarian users, avoid meat/fish/poultry. For vegan users, avoid all animal products. For halal users, avoid pork and non-halal meat. Use your knowledge of food to make appropriate selections.

Return ONLY valid JSON matching this schema:
{
  "meals": [
    { "meal": "breakfast", "items": [{ "itemId": "exact-id", "servings": 1 }] },
    { "meal": "lunch", "items": [{ "itemId": "exact-id", "servings": 2 }] },
    { "meal": "dinner", "items": [{ "itemId": "exact-id", "servings": 1 }] }
  ]
}`;

  let userPrompt = `${prefsContext}\nMENU:${menuContext}`;

  if (userFeedback) {
    userPrompt += `\n\nUSER REQUEST: ${userFeedback}`;
  }

  userPrompt += `\n\nCreate a meal plan. Return ONLY JSON.`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find(c => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No response from LLM");
  }

  let plan: LLMDailyPlan;
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    plan = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse LLM response:", textContent.text);
    throw new Error(`Failed to parse response: ${e}`);
  }

  // Validate the response structure
  if (!plan || !plan.meals || !Array.isArray(plan.meals)) {
    console.error("Invalid LLM response structure:", plan);
    throw new Error("LLM returned invalid meal plan structure");
  }

  return convertPlanToSuggestion(plan, menu);
}

function convertPlanToSuggestion(
  plan: LLMDailyPlan,
  menu: DailyMenu
): DailySuggestion {
  // Build item lookup
  const itemLookup = new Map<string, MenuItem>();
  for (const location of Object.values(menu.locations)) {
    for (const mealItems of Object.values(location.meals)) {
      for (const item of mealItems) {
        itemLookup.set(item.id, item);
      }
    }
  }

  const meals: MealSuggestion[] = [];

  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const llmMeal = plan.meals.find(m => m.meal === mealType);

    if (!llmMeal || llmMeal.items.length === 0) {
      meals.push({
        meal: mealType,
        items: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      });
      continue;
    }

    const selectedItems: SelectedItem[] = [];

    for (const llmItem of llmMeal.items) {
      const menuItem = itemLookup.get(llmItem.itemId);
      if (!menuItem) {
        console.warn(`LLM selected non-existent item: ${llmItem.itemId}`);
        continue;
      }

      const servings = Math.max(1, Math.min(5, Math.round(llmItem.servings)));
      selectedItems.push({
        item: menuItem,
        servings,
        displayQuantity: formatServingSize(menuItem, servings),
      });
    }

    const totals = selectedItems.reduce(
      (acc, { item, servings }) => ({
        calories: acc.calories + item.calories * servings,
        protein: acc.protein + item.protein * servings,
        carbs: acc.carbs + item.carbs * servings,
        fat: acc.fat + item.fat * servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    meals.push({ meal: mealType, items: selectedItems, totals });
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

  return { date: menu.date, meals, dailyTotals };
}
