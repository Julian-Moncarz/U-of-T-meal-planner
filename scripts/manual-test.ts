import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrapeMenuForToday } from "../src/lib/scraper";
import { generateMealPlan } from "../src/lib/llmSuggestions";
import { UserPreferences } from "../src/types/menu";

async function runManualTest() {
  console.log("=== UofT Meal Planner Manual Test ===\n");

  // Test 1: Scrape today's menu
  console.log("1. Testing menu scraper...");
  try {
    const menu = await scrapeMenuForToday();
    const locationCount = Object.keys(menu.locations).length;
    console.log(`   ✓ Scraped ${locationCount} locations for ${menu.date}`);

    // Show sample items from each location
    for (const [locId, location] of Object.entries(menu.locations)) {
      const mealTypes = Object.keys(location.meals);
      const totalItems = mealTypes.reduce(
        (sum, m) => sum + (location.meals[m]?.length || 0),
        0
      );
      console.log(`   - ${location.name}: ${totalItems} items across ${mealTypes.join(", ")}`);
    }

    if (locationCount === 0) {
      console.log("   ⚠ No locations found - check if dining halls are open today");
      return;
    }

    // Test 2: Generate meal plan
    console.log("\n2. Testing LLM meal generation...");

    const testPrefs: UserPreferences = {
      targetCalories: 2000,
      targetProtein: 150,
      dietaryPreferences: "",
      breakfastLocation: "campusone",
      lunchLocation: "campusone",
      dinnerLocation: "campusone",
      onboardingCompleted: true,
    };

    // Try with the first available location
    const firstLocation = Object.keys(menu.locations)[0];
    testPrefs.breakfastLocation = firstLocation;
    testPrefs.lunchLocation = firstLocation;
    testPrefs.dinnerLocation = firstLocation;

    const suggestion = await generateMealPlan(menu, testPrefs);

    console.log(`   ✓ Generated meal plan for ${suggestion.date}`);
    console.log(`   Daily totals: ${suggestion.dailyTotals.calories} cal, ${suggestion.dailyTotals.protein}g protein\n`);

    for (const meal of suggestion.meals) {
      console.log(`   ${meal.meal.toUpperCase()}:`);
      if (meal.items.length === 0) {
        console.log("      (no items)");
      } else {
        for (const item of meal.items) {
          console.log(`      - ${item.item.name} (${item.displayQuantity})`);
          console.log(`        ${item.item.calories * item.servings}cal, ${item.item.protein * item.servings}g protein`);
        }
      }
      console.log(`      Meal total: ${meal.totals.calories} cal, ${meal.totals.protein}g protein\n`);
    }

    console.log("=== All tests passed! ===");
  } catch (error) {
    console.error("   ✗ Test failed:", error);
    process.exit(1);
  }
}

runManualTest();
