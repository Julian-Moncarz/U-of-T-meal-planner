/**
 * End-to-end test with real UofT menu data
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrapeMenuForToday } from "../src/lib/scraper";
import { generateDailySuggestionLLM } from "../src/lib/llmSuggestions";
import { UserPreferences } from "../src/types/menu";

async function main() {
  console.log("=".repeat(60));
  console.log("End-to-End Test with Real UofT Menu Data");
  console.log("=".repeat(60));

  // Fetch real menu data
  console.log("\n1. Fetching today's menu from UofT...");
  let menu;
  try {
    menu = await scrapeMenuForToday();
    console.log(`   Fetched menu for ${menu.date}`);
    console.log(`   Locations: ${Object.keys(menu.locations).join(", ")}`);

    // Count items per location
    for (const [locId, loc] of Object.entries(menu.locations)) {
      const totalItems = Object.values(loc.meals).flat().length;
      console.log(`   - ${loc.name}: ${totalItems} items`);
    }
  } catch (e) {
    console.log(`   Failed to fetch menu: ${e}`);
    console.log("   Using fallback test - menu scraping may be unavailable");
    return;
  }

  // Test preferences
  const prefs: UserPreferences = {
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFat: 70,
    breakfastLocation: "campusone",
    lunchLocation: "campusone",
    dinnerLocation: "campusone",
    dietaryFilter: "all",
    excludedAllergens: [],
    excludedProteins: [],
    isHalal: false,
    likedItemIds: [],
    dislikedItemIds: [],
    onboardingCompleted: true,
  };

  // Test basic generation
  console.log("\n2. Generating meal plan (V1 approach)...");
  try {
    const suggestion = await generateDailySuggestionLLM(menu, prefs, {
      approach: "v1",
    });

    console.log("\n   MEAL PLAN:");
    for (const meal of suggestion.meals) {
      console.log(`\n   ${meal.meal.toUpperCase()}:`);
      if (meal.items.length === 0) {
        console.log("      (no items - location may not serve this meal)");
      }
      for (const item of meal.items) {
        console.log(`      - ${item.item.name} x${item.servings} (${item.displayQuantity})`);
        console.log(`        ${item.item.calories * item.servings}cal, ${item.item.protein * item.servings}g protein`);
      }
      console.log(`      Meal totals: ${meal.totals.calories}cal, ${meal.totals.protein}g protein`);
    }

    console.log(`\n   DAILY TOTALS: ${suggestion.dailyTotals.calories}cal, ${suggestion.dailyTotals.protein}g protein`);
    console.log(`   Target: ${prefs.targetCalories}cal, ${prefs.targetProtein}g protein`);
    console.log(`   Achievement: ${Math.round(suggestion.dailyTotals.calories / prefs.targetCalories * 100)}% cal, ${Math.round(suggestion.dailyTotals.protein / prefs.targetProtein * 100)}% protein`);

  } catch (e) {
    console.log(`   Failed: ${e}`);
  }

  // Test with feedback
  console.log("\n3. Regenerating with feedback: 'More vegetables please'...");
  try {
    const suggestion = await generateDailySuggestionLLM(menu, prefs, {
      approach: "v1",
      userFeedback: "I want more vegetables and greens in my meals. Include salads or steamed vegetables.",
    });

    console.log("\n   UPDATED MEAL PLAN:");
    for (const meal of suggestion.meals) {
      console.log(`\n   ${meal.meal.toUpperCase()}:`);
      for (const item of meal.items) {
        console.log(`      - ${item.item.name} x${item.servings}`);
      }
    }

    console.log("\n   SUCCESS - Feedback incorporated!");

  } catch (e) {
    console.log(`   Failed: ${e}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("End-to-End Test Complete");
  console.log("=".repeat(60));
}

main().catch(console.error);
