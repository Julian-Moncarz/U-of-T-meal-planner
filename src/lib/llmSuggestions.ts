import Anthropic from "@anthropic-ai/sdk";
import { MenuItem, UserPreferences, DailyMenu } from "@/types/menu";
import { DailySuggestionMVP, MealSuggestionMVP, SelectedItem, formatServingSize } from "./suggestions";

// Use Claude Haiku 4.5 for cost efficiency ($1/$5 per million tokens)
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const anthropic = new Anthropic();

// ============================================================================
// APPROACH 1: Single Structured Prompt
// ============================================================================

interface LLMMenuSelection {
  meal: "breakfast" | "lunch" | "dinner";
  items: Array<{
    itemId: string;
    servings: number;
    reasoning: string;
  }>;
}

interface LLMDailyPlan {
  meals: LLMMenuSelection[];
  overallReasoning: string;
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
    context += `Available items:\n`;

    for (const item of items) {
      context += `- ID: "${item.id}" | ${item.name} | Category: ${item.category} | `;
      context += `Per serving (${item.servingSize}): ${item.calories}cal, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fat}g fat`;

      const flags: string[] = [];
      if (item.isVegetarian) flags.push("vegetarian");
      if (item.isVegan) flags.push("vegan");
      if (item.isHalal) flags.push("halal");
      if (flags.length > 0) context += ` [${flags.join(", ")}]`;

      context += "\n";
    }
  }

  return context;
}

function buildUserPreferencesContext(prefs: UserPreferences): string {
  let context = `
## USER TARGETS (daily)
- Calories: ${prefs.targetCalories}
- Protein: ${prefs.targetProtein}g
- Carbs: ${prefs.targetCarbs}g
- Fat: ${prefs.targetFat}g

## DIETARY RESTRICTIONS
- Diet type: ${prefs.dietaryFilter}
${prefs.isHalal ? "- MUST be halal" : ""}
${prefs.excludedProteins.length > 0 ? `- Excluded proteins: ${prefs.excludedProteins.join(", ")}` : ""}
${prefs.excludedAllergens.length > 0 ? `- Excluded allergens: ${prefs.excludedAllergens.join(", ")}` : ""}

## PREFERENCES
${prefs.likedItemIds.length > 0 ? `- Liked item IDs (prefer these): ${prefs.likedItemIds.slice(0, 10).join(", ")}` : "- No liked items yet"}
${prefs.dislikedItemIds.length > 0 ? `- Disliked item IDs (avoid these): ${prefs.dislikedItemIds.join(", ")}` : ""}
`;

  return context;
}

export async function generateDailySuggestionLLM_V1(
  menu: DailyMenu,
  prefs: UserPreferences,
  userFeedback?: string
): Promise<DailySuggestionMVP> {
  const menuContext = buildMenuContext(menu, prefs);
  const prefsContext = buildUserPreferencesContext(prefs);

  const systemPrompt = `You are a nutrition-focused meal planning assistant for university students. Your job is to select meals from available dining hall items that best match the user's nutritional targets and dietary restrictions.

CRITICAL RULES:
1. ONLY select items from the provided menu - never suggest items that don't exist
2. ONLY use the exact item IDs provided in the menu
3. Respect ALL dietary restrictions strictly (vegetarian, vegan, halal, excluded allergens, excluded proteins)
4. Optimize for hitting protein targets first, then overall calorie targets
5. Aim for roughly: 25% of daily targets for breakfast, 35% for lunch, 40% for dinner
6. Servings can range from 1-5 for main dishes

Return your response as valid JSON matching this exact schema:
{
  "meals": [
    {
      "meal": "breakfast" | "lunch" | "dinner",
      "items": [
        {
          "itemId": "exact-item-id-from-menu",
          "servings": number (1-5),
          "reasoning": "brief explanation"
        }
      ]
    }
  ],
  "overallReasoning": "brief summary of the meal plan strategy"
}`;

  let userPrompt = `${menuContext}\n${prefsContext}`;

  if (userFeedback) {
    userPrompt += `\n## USER FEEDBACK (incorporate this)\n${userFeedback}\n`;
  }

  userPrompt += `\nPlease select the best items for each meal to meet my nutritional targets. Return ONLY valid JSON, no other text.`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2000,
    messages: [
      { role: "user", content: userPrompt }
    ],
    system: systemPrompt,
  });

  // Parse the response
  const textContent = response.content.find(c => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from LLM");
  }

  let plan: LLMDailyPlan;
  try {
    // Try to extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    plan = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse LLM response:", textContent.text);
    throw new Error(`Failed to parse LLM response: ${e}`);
  }

  // Convert LLM plan to DailySuggestionMVP format
  return convertLLMPlanToSuggestion(plan, menu, prefs);
}

function convertLLMPlanToSuggestion(
  plan: LLMDailyPlan,
  menu: DailyMenu,
  prefs: UserPreferences
): DailySuggestionMVP {
  const locationMap: Record<string, string> = {
    breakfast: prefs.breakfastLocation,
    lunch: prefs.lunchLocation,
    dinner: prefs.dinnerLocation,
  };

  // Build a lookup map for all menu items
  const itemLookup = new Map<string, MenuItem>();
  for (const locationId of Object.keys(menu.locations)) {
    const location = menu.locations[locationId];
    for (const mealType of Object.keys(location.meals)) {
      for (const item of location.meals[mealType]) {
        itemLookup.set(item.id, item);
      }
    }
  }

  const meals: MealSuggestionMVP[] = [];

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

      // Validate the item against preferences (double-check LLM didn't violate restrictions)
      if (!validateItemAgainstPrefs(menuItem, prefs)) {
        console.warn(`LLM selected item that violates preferences: ${menuItem.name}`);
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

    meals.push({
      meal: mealType,
      items: selectedItems,
      totals,
    });
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

// Protein keywords for filtering
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

  // Halal validation: item is halal-safe if:
  // 1. Explicitly marked halal, OR
  // 2. Is vegetarian/vegan (no meat = halal-safe for most interpretations)
  if (prefs.isHalal && !item.isHalal && !item.isVegetarian && !item.isVegan) return false;

  for (const allergen of prefs.excludedAllergens) {
    if (item.allergens.includes(allergen)) return false;
  }
  if (containsExcludedProtein(item.name, prefs.excludedProteins)) return false;
  return true;
}

// ============================================================================
// APPROACH 2: Two-Stage Pipeline (Filter then Select)
// ============================================================================

async function filterItemsWithLLM(
  items: MenuItem[],
  prefs: UserPreferences
): Promise<MenuItem[]> {
  // First pass: deterministic filtering (fast)
  const filtered = items.filter(item => validateItemAgainstPrefs(item, prefs));
  return filtered;
}

export async function generateDailySuggestionLLM_V2(
  menu: DailyMenu,
  prefs: UserPreferences,
  userFeedback?: string
): Promise<DailySuggestionMVP> {
  // Stage 1: Pre-filter items deterministically
  const locationMap: Record<string, string> = {
    breakfast: prefs.breakfastLocation,
    lunch: prefs.lunchLocation,
    dinner: prefs.dinnerLocation,
  };

  const filteredMenu: DailyMenu = {
    date: menu.date,
    locations: {},
  };

  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const locationId = locationMap[mealType];
    const location = menu.locations[locationId];

    if (!location) continue;

    if (!filteredMenu.locations[locationId]) {
      filteredMenu.locations[locationId] = {
        name: location.name,
        meals: {},
      };
    }

    const mealItems = location.meals[mealType] || [];
    filteredMenu.locations[locationId].meals[mealType] = await filterItemsWithLLM(mealItems, prefs);
  }

  // Stage 2: Use LLM only for selection from pre-filtered items
  // This makes the LLM's job easier and reduces hallucination risk
  const menuContext = buildMenuContext(filteredMenu, prefs);
  const prefsContext = buildUserPreferencesContext(prefs);

  const systemPrompt = `You are a meal planning assistant. All items shown have already been filtered to match dietary restrictions.

Your ONLY job is to select the BEST combination of items to hit nutritional targets.

CRITICAL:
1. ONLY use exact item IDs from the menu below
2. Each meal should have 1-3 items
3. Optimize for protein first, then overall calories
4. Target distribution: breakfast 25%, lunch 35%, dinner 40%

Return ONLY valid JSON:
{
  "meals": [
    {
      "meal": "breakfast",
      "items": [{ "itemId": "exact-id", "servings": 1 }]
    },
    {
      "meal": "lunch",
      "items": [{ "itemId": "exact-id", "servings": 2 }]
    },
    {
      "meal": "dinner",
      "items": [{ "itemId": "exact-id", "servings": 1 }]
    }
  ]
}`;

  let userPrompt = `FILTERED MENU (all items are safe for your restrictions):\n${menuContext}\n\n`;
  userPrompt += `TARGETS:\n- Daily calories: ${prefs.targetCalories}\n- Daily protein: ${prefs.targetProtein}g\n\n`;

  if (userFeedback) {
    userPrompt += `USER FEEDBACK: ${userFeedback}\n\n`;
  }

  userPrompt += `Select items. Return ONLY JSON.`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const textContent = response.content.find(c => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from LLM");
  }

  let plan: LLMDailyPlan;
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    plan = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse:", textContent.text);
    throw new Error(`Parse error: ${e}`);
  }

  return convertLLMPlanToSuggestion(plan, filteredMenu, prefs);
}

// ============================================================================
// APPROACH 3: LLM with Calculation Tools
// ============================================================================

interface CalculationResult {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meetsTargets: boolean;
  proteinPercent: number;
  caloriePercent: number;
}

function calculateMealTotals(
  items: Array<{ item: MenuItem; servings: number }>,
  prefs: UserPreferences
): CalculationResult {
  const totals = items.reduce(
    (acc, { item, servings }) => ({
      calories: acc.calories + item.calories * servings,
      protein: acc.protein + item.protein * servings,
      carbs: acc.carbs + item.carbs * servings,
      fat: acc.fat + item.fat * servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    meetsTargets: totals.protein >= prefs.targetProtein * 0.9 && totals.calories <= prefs.targetCalories * 1.1,
    proteinPercent: Math.round((totals.protein / prefs.targetProtein) * 100),
    caloriePercent: Math.round((totals.calories / prefs.targetCalories) * 100),
  };
}

export async function generateDailySuggestionLLM_V3(
  menu: DailyMenu,
  prefs: UserPreferences,
  userFeedback?: string
): Promise<DailySuggestionMVP> {
  // Pre-filter menu
  const locationMap: Record<string, string> = {
    breakfast: prefs.breakfastLocation,
    lunch: prefs.lunchLocation,
    dinner: prefs.dinnerLocation,
  };

  // Build item lookup
  const itemLookup = new Map<string, MenuItem>();
  for (const locationId of Object.keys(menu.locations)) {
    const location = menu.locations[locationId];
    for (const mealType of Object.keys(location.meals)) {
      for (const item of location.meals[mealType]) {
        if (validateItemAgainstPrefs(item, prefs)) {
          itemLookup.set(item.id, item);
        }
      }
    }
  }

  // Build filtered menu context with ONLY valid items
  let menuContext = "";
  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const locationId = locationMap[mealType];
    const location = menu.locations[locationId];

    if (!location || !location.meals[mealType]) continue;

    const validItems = location.meals[mealType].filter(item =>
      validateItemAgainstPrefs(item, prefs)
    );

    menuContext += `\n## ${mealType.toUpperCase()}\n`;
    for (const item of validItems) {
      menuContext += `ID:"${item.id}" | ${item.name} | ${item.calories}cal/${item.protein}g protein per ${item.servingSize}\n`;
    }
  }

  // Single tool for submitting the meal plan
  const tools: Anthropic.Tool[] = [
    {
      name: "submit_meal_plan",
      description: "Submit your meal plan selections. You must call this tool with your selections for all three meals.",
      input_schema: {
        type: "object" as const,
        properties: {
          breakfast: {
            type: "array",
            items: {
              type: "object",
              properties: {
                itemId: { type: "string", description: "Exact item ID from the menu" },
                servings: { type: "number", description: "Number of servings (1-5)" },
              },
              required: ["itemId", "servings"],
            },
          },
          lunch: {
            type: "array",
            items: {
              type: "object",
              properties: {
                itemId: { type: "string" },
                servings: { type: "number" },
              },
              required: ["itemId", "servings"],
            },
          },
          dinner: {
            type: "array",
            items: {
              type: "object",
              properties: {
                itemId: { type: "string" },
                servings: { type: "number" },
              },
              required: ["itemId", "servings"],
            },
          },
        },
        required: ["breakfast", "lunch", "dinner"],
      },
    },
  ];

  const systemPrompt = `Select items from this menu to create a meal plan.

TARGETS: ${prefs.targetCalories} cal, ${prefs.targetProtein}g protein daily.
${userFeedback ? `USER REQUEST: ${userFeedback}\n` : ""}
MENU:${menuContext}

Call submit_meal_plan with items for breakfast, lunch, and dinner. Use exact item IDs, servings 1-5.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "Please create a meal plan for me that hits my nutritional targets." }
  ];

  let finalPlan: { breakfast: Array<{itemId: string, servings: number}>, lunch: Array<{itemId: string, servings: number}>, dinner: Array<{itemId: string, servings: number}> } | null = null;
  let iterations = 0;
  const maxIterations = 5;

  while (!finalPlan && iterations < maxIterations) {
    iterations++;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      tools,
      tool_choice: { type: "any" }, // Force tool use
      messages,
    });

    // Process tool calls
    for (const content of response.content) {
      if (content.type === "tool_use" && content.name === "submit_meal_plan") {
        finalPlan = content.input as typeof finalPlan;
        break;
      }
    }

    if (finalPlan) break;
  }

  if (!finalPlan) {
    throw new Error("LLM failed to submit a meal plan after " + maxIterations + " iterations");
  }

  // Convert to DailySuggestionMVP
  const meals: MealSuggestionMVP[] = [];

  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
    const mealItems = finalPlan[mealType] || [];
    const selectedItems: SelectedItem[] = [];

    for (const selection of mealItems) {
      const item = itemLookup.get(selection.itemId);
      if (!item) continue;

      const servings = Math.max(1, Math.min(5, Math.round(selection.servings)));
      selectedItems.push({
        item,
        servings,
        displayQuantity: formatServingSize(item, servings),
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

// ============================================================================
// Main Export: Configurable LLM Suggestion Generator
// ============================================================================

export type LLMApproach = "v1" | "v2" | "v3";

export async function generateDailySuggestionLLM(
  menu: DailyMenu,
  prefs: UserPreferences,
  options?: {
    approach?: LLMApproach;
    userFeedback?: string;
  }
): Promise<DailySuggestionMVP> {
  const approach = options?.approach || "v1"; // V1 is the best performer
  const userFeedback = options?.userFeedback;

  switch (approach) {
    case "v1":
      return generateDailySuggestionLLM_V1(menu, prefs, userFeedback);
    case "v2":
      return generateDailySuggestionLLM_V2(menu, prefs, userFeedback);
    case "v3":
      return generateDailySuggestionLLM_V3(menu, prefs, userFeedback);
    default:
      return generateDailySuggestionLLM_V2(menu, prefs, userFeedback);
  }
}
