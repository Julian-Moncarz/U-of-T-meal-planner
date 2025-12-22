import Anthropic from "@anthropic-ai/sdk";
import { MenuItem, UserPreferences, DailyMenu } from "@/types/menu";

const anthropic = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

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
// Shared Constants & Utilities
// ============================================================================

const PROTEIN_KEYWORDS: Record<string, string[]> = {
  fish: ["fish", "salmon", "tuna", "cod", "tilapia", "halibut", "trout", "mackerel", "sardine", "anchovy"],
  pork: ["pork", "bacon", "ham", "sausage", "pepperoni", "prosciutto", "chorizo"],
  beef: ["beef", "steak", "burger", "brisket", "meatball"],
  shellfish: ["shrimp", "prawn", "crab", "lobster", "oyster", "clam", "mussel", "scallop", "calamari", "squid"],
  tofu: ["tofu"],
  lamb: ["lamb"],
};

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

function validateItemAgainstPrefs(item: MenuItem, prefs: UserPreferences): boolean {
  if (prefs.dietaryFilter === "vegetarian" && !item.isVegetarian) return false;
  if (prefs.dietaryFilter === "vegan" && !item.isVegan) return false;
  // Halal: item is safe if explicitly halal OR vegetarian/vegan
  if (prefs.isHalal && !item.isHalal && !item.isVegetarian && !item.isVegan) return false;
  for (const allergen of prefs.excludedAllergens) {
    if (item.allergens.includes(allergen)) return false;
  }
  if (containsExcludedProtein(item.name, prefs.excludedProteins)) return false;
  return true;
}

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
      // Skip items that don't meet preferences
      if (!validateItemAgainstPrefs(item, prefs)) continue;

      context += `- ID: "${item.id}" | ${item.name} | `;
      context += `${item.calories}cal, ${item.protein}g protein per ${item.servingSize}`;

      const flags: string[] = [];
      if (item.isVegetarian) flags.push("V");
      if (item.isVegan) flags.push("VG");
      if (item.isHalal) flags.push("H");
      if (flags.length > 0) context += ` [${flags.join(",")}]`;

      context += "\n";
    }
  }

  return context;
}

function buildPreferencesContext(prefs: UserPreferences): string {
  let context = `
DAILY TARGETS: ${prefs.targetCalories} cal, ${prefs.targetProtein}g protein
MEAL DISTRIBUTION: breakfast 25%, lunch 35%, dinner 40%
`;

  const restrictions: string[] = [];
  if (prefs.dietaryFilter !== "all") restrictions.push(prefs.dietaryFilter);
  if (prefs.isHalal) restrictions.push("halal");
  if (prefs.excludedProteins.length > 0) restrictions.push(`no ${prefs.excludedProteins.join("/")}`);

  if (restrictions.length > 0) {
    context += `RESTRICTIONS: ${restrictions.join(", ")}\n`;
  }

  if (prefs.likedItemIds.length > 0) {
    context += `PREFERRED ITEMS: ${prefs.likedItemIds.slice(0, 5).join(", ")}\n`;
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
4. Respect all dietary restrictions (items shown are already filtered)

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

  const response = await anthropic.messages.create({
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

  return convertPlanToSuggestion(plan, menu, prefs);
}

function convertPlanToSuggestion(
  plan: LLMDailyPlan,
  menu: DailyMenu,
  prefs: UserPreferences
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

      if (!validateItemAgainstPrefs(menuItem, prefs)) {
        console.warn(`LLM selected invalid item: ${menuItem.name}`);
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
