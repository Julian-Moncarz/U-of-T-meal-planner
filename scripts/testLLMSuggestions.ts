/**
 * Test script for LLM-based meal suggestions
 *
 * Tests against criteria:
 * 1. Validity - Only suggests items that exist in input data
 * 2. Constraint adherence - Respects dietary restrictions
 * 3. Nutritional accuracy - Correct calorie/macro totals
 * 4. Feedback incorporation - Responds to user feedback
 * 5. Structured output - Parseable, displayable results
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateDailySuggestionLLM, LLMApproach } from "../src/lib/llmSuggestions";
import { DailyMenu, UserPreferences, MenuItem } from "../src/types/menu";
import { DailySuggestionMVP } from "../src/lib/suggestions";

// ============================================================================
// Mock Data
// ============================================================================

function createMockMenu(): DailyMenu {
  const createItem = (
    id: string,
    name: string,
    category: string,
    location: string,
    meal: "breakfast" | "lunch" | "dinner",
    nutrition: { calories: number; protein: number; carbs: number; fat: number },
    flags: { vegetarian?: boolean; vegan?: boolean; halal?: boolean } = {}
  ): MenuItem => ({
    id,
    name,
    category,
    location,
    meal,
    date: "2025-12-22",
    servingSize: "100g",
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: 2,
    sugar: 5,
    sodium: 200,
    isVegetarian: flags.vegetarian || false,
    isVegan: flags.vegan || false,
    isHalal: flags.halal || false,
    allergens: [],
  });

  return {
    date: "2025-12-22",
    locations: {
      campusone: {
        name: "CampusOne Dining Hall",
        meals: {
          breakfast: [
            createItem("b1", "Scrambled Eggs", "Breakfast Entree", "CampusOne", "breakfast", { calories: 150, protein: 12, carbs: 2, fat: 10 }, { vegetarian: true }),
            createItem("b2", "Turkey Bacon", "Breakfast Entree", "CampusOne", "breakfast", { calories: 100, protein: 8, carbs: 1, fat: 7 }, { halal: false }),
            createItem("b3", "Oatmeal", "Breakfast Entree", "CampusOne", "breakfast", { calories: 150, protein: 5, carbs: 27, fat: 3 }, { vegan: true, vegetarian: true }),
            createItem("b4", "Greek Yogurt Parfait", "Breakfast Entree", "CampusOne", "breakfast", { calories: 200, protein: 15, carbs: 25, fat: 5 }, { vegetarian: true }),
            createItem("b5", "Halal Chicken Sausage", "Breakfast Entree", "CampusOne", "breakfast", { calories: 180, protein: 14, carbs: 3, fat: 12 }, { halal: true }),
            createItem("b6", "Pork Sausage Links", "Breakfast Entree", "CampusOne", "breakfast", { calories: 200, protein: 10, carbs: 2, fat: 16 }),
          ],
          lunch: [
            createItem("l1", "Grilled Chicken Breast", "Grill", "CampusOne", "lunch", { calories: 200, protein: 35, carbs: 0, fat: 5 }, { halal: true }),
            createItem("l2", "Beef Burger", "Grill", "CampusOne", "lunch", { calories: 350, protein: 25, carbs: 30, fat: 18 }),
            createItem("l3", "Veggie Bowl", "Bowls", "CampusOne", "lunch", { calories: 300, protein: 12, carbs: 45, fat: 8 }, { vegan: true, vegetarian: true }),
            createItem("l4", "Salmon Fillet", "Grill", "CampusOne", "lunch", { calories: 250, protein: 30, carbs: 0, fat: 14 }),
            createItem("l5", "Tofu Stir Fry", "Bowls", "CampusOne", "lunch", { calories: 280, protein: 18, carbs: 30, fat: 12 }, { vegan: true, vegetarian: true }),
            createItem("l6", "Caesar Salad", "Salad Bar", "CampusOne", "lunch", { calories: 150, protein: 5, carbs: 10, fat: 10 }, { vegetarian: true }),
            createItem("l7", "Cottage Cheese Cup", "Sides and More", "CampusOne", "lunch", { calories: 120, protein: 14, carbs: 5, fat: 5 }, { vegetarian: true }),
          ],
          dinner: [
            createItem("d1", "Grilled Halal Chicken Thigh", "Dinner Entree", "CampusOne", "dinner", { calories: 250, protein: 28, carbs: 2, fat: 14 }, { halal: true }),
            createItem("d2", "Lamb Kebab", "Dinner Entree", "CampusOne", "dinner", { calories: 300, protein: 25, carbs: 5, fat: 20 }, { halal: true }),
            createItem("d3", "Vegetarian Lasagna", "Dinner Entree", "CampusOne", "dinner", { calories: 400, protein: 18, carbs: 45, fat: 15 }, { vegetarian: true }),
            createItem("d4", "Shrimp Scampi", "Dinner Entree", "CampusOne", "dinner", { calories: 350, protein: 28, carbs: 30, fat: 15 }),
            createItem("d5", "Steamed Broccoli", "Sides and More", "CampusOne", "dinner", { calories: 50, protein: 4, carbs: 8, fat: 1 }, { vegan: true, vegetarian: true }),
            createItem("d6", "Brown Rice", "Sides and More", "CampusOne", "dinner", { calories: 150, protein: 4, carbs: 32, fat: 1 }, { vegan: true, vegetarian: true }),
          ],
        },
      },
    },
  };
}

function createMockPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
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
    ...overrides,
  };
}

// ============================================================================
// Test Criteria
// ============================================================================

interface TestResult {
  passed: boolean;
  details: string;
}

function testValidity(suggestion: DailySuggestionMVP, menu: DailyMenu): TestResult {
  // Check that all suggested items exist in the menu
  const allMenuItemIds = new Set<string>();
  for (const loc of Object.values(menu.locations)) {
    for (const mealItems of Object.values(loc.meals)) {
      for (const item of mealItems) {
        allMenuItemIds.add(item.id);
      }
    }
  }

  const invalidItems: string[] = [];
  for (const meal of suggestion.meals) {
    for (const selected of meal.items) {
      if (!allMenuItemIds.has(selected.item.id)) {
        invalidItems.push(selected.item.id);
      }
    }
  }

  return {
    passed: invalidItems.length === 0,
    details: invalidItems.length === 0
      ? "All items exist in menu"
      : `Invalid items: ${invalidItems.join(", ")}`,
  };
}

function testConstraintAdherence(
  suggestion: DailySuggestionMVP,
  prefs: UserPreferences
): TestResult {
  const violations: string[] = [];

  for (const meal of suggestion.meals) {
    for (const selected of meal.items) {
      const item = selected.item;

      // Check dietary filter
      if (prefs.dietaryFilter === "vegetarian" && !item.isVegetarian) {
        violations.push(`${item.name} is not vegetarian`);
      }
      if (prefs.dietaryFilter === "vegan" && !item.isVegan) {
        violations.push(`${item.name} is not vegan`);
      }

      // Check halal - vegetarian/vegan items are considered halal-safe
      if (prefs.isHalal && !item.isHalal && !item.isVegetarian && !item.isVegan) {
        violations.push(`${item.name} is not halal`);
      }

      // Check excluded proteins
      const lowerName = item.name.toLowerCase();
      for (const protein of prefs.excludedProteins) {
        if (lowerName.includes(protein)) {
          violations.push(`${item.name} contains excluded protein: ${protein}`);
        }
      }
    }
  }

  return {
    passed: violations.length === 0,
    details: violations.length === 0
      ? "All constraints respected"
      : `Violations: ${violations.join("; ")}`,
  };
}

function testNutritionalAccuracy(suggestion: DailySuggestionMVP): TestResult {
  // Verify that totals are correctly calculated
  let calculatedCalories = 0;
  let calculatedProtein = 0;

  for (const meal of suggestion.meals) {
    let mealCalories = 0;
    let mealProtein = 0;

    for (const selected of meal.items) {
      mealCalories += selected.item.calories * selected.servings;
      mealProtein += selected.item.protein * selected.servings;
    }

    // Check meal totals
    if (Math.abs(mealCalories - meal.totals.calories) > 1) {
      return {
        passed: false,
        details: `Meal ${meal.meal} calories mismatch: calculated ${mealCalories}, reported ${meal.totals.calories}`,
      };
    }
    if (Math.abs(mealProtein - meal.totals.protein) > 1) {
      return {
        passed: false,
        details: `Meal ${meal.meal} protein mismatch: calculated ${mealProtein}, reported ${meal.totals.protein}`,
      };
    }

    calculatedCalories += mealCalories;
    calculatedProtein += mealProtein;
  }

  // Check daily totals
  if (Math.abs(calculatedCalories - suggestion.dailyTotals.calories) > 1) {
    return {
      passed: false,
      details: `Daily calories mismatch: calculated ${calculatedCalories}, reported ${suggestion.dailyTotals.calories}`,
    };
  }

  return {
    passed: true,
    details: `Totals verified: ${suggestion.dailyTotals.calories} cal, ${suggestion.dailyTotals.protein}g protein`,
  };
}

function testStructuredOutput(suggestion: DailySuggestionMVP): TestResult {
  // Check that output is well-structured
  const issues: string[] = [];

  if (!suggestion.date) issues.push("Missing date");
  if (!suggestion.meals || suggestion.meals.length !== 3) issues.push("Should have 3 meals");
  if (!suggestion.dailyTotals) issues.push("Missing daily totals");

  for (const meal of suggestion.meals || []) {
    if (!meal.meal) issues.push("Meal missing type");
    if (!meal.items) issues.push(`${meal.meal} missing items array`);
    if (!meal.totals) issues.push(`${meal.meal} missing totals`);

    for (const item of meal.items || []) {
      if (!item.item) issues.push("Selected item missing item data");
      if (!item.servings || item.servings < 1) issues.push("Invalid servings");
      if (!item.displayQuantity) issues.push("Missing display quantity");
    }
  }

  return {
    passed: issues.length === 0,
    details: issues.length === 0 ? "Well-structured output" : `Issues: ${issues.join("; ")}`,
  };
}

function testTargetProximity(
  suggestion: DailySuggestionMVP,
  prefs: UserPreferences
): TestResult {
  const proteinPercent = (suggestion.dailyTotals.protein / prefs.targetProtein) * 100;
  const caloriePercent = (suggestion.dailyTotals.calories / prefs.targetCalories) * 100;

  const details = `Protein: ${Math.round(proteinPercent)}% of target, Calories: ${Math.round(caloriePercent)}% of target`;

  // Consider it passing if within reasonable range
  const passed = proteinPercent >= 70 && caloriePercent >= 60 && caloriePercent <= 130;

  return { passed, details };
}

// ============================================================================
// Test Runner
// ============================================================================

interface TestSuite {
  name: string;
  prefs: UserPreferences;
  feedback?: string;
  expectedBehavior?: string;
}

async function runTest(
  approach: LLMApproach,
  menu: DailyMenu,
  suite: TestSuite
): Promise<{
  approach: LLMApproach;
  suite: string;
  suggestion: DailySuggestionMVP | null;
  error: string | null;
  results: Record<string, TestResult>;
  allPassed: boolean;
}> {
  console.log(`\n--- Testing ${approach.toUpperCase()} | ${suite.name} ---`);

  try {
    const suggestion = await generateDailySuggestionLLM(menu, suite.prefs, {
      approach,
      userFeedback: suite.feedback,
    });

    const results = {
      validity: testValidity(suggestion, menu),
      constraints: testConstraintAdherence(suggestion, suite.prefs),
      accuracy: testNutritionalAccuracy(suggestion),
      structure: testStructuredOutput(suggestion),
      targets: testTargetProximity(suggestion, suite.prefs),
    };

    const allPassed = Object.values(results).every(r => r.passed);

    // Print results
    for (const [name, result] of Object.entries(results)) {
      const status = result.passed ? "✓" : "✗";
      console.log(`  ${status} ${name}: ${result.details}`);
    }

    // Print meal summary
    console.log(`\n  Meal Summary:`);
    for (const meal of suggestion.meals) {
      console.log(`    ${meal.meal}: ${meal.items.map(i => `${i.item.name} x${i.servings}`).join(", ") || "(no items)"}`);
      console.log(`      → ${meal.totals.calories}cal, ${meal.totals.protein}g protein`);
    }
    console.log(`    DAILY: ${suggestion.dailyTotals.calories}cal, ${suggestion.dailyTotals.protein}g protein`);

    return { approach, suite: suite.name, suggestion, error: null, results, allPassed };

  } catch (error) {
    console.log(`  ✗ ERROR: ${error}`);
    return {
      approach,
      suite: suite.name,
      suggestion: null,
      error: String(error),
      results: {},
      allPassed: false,
    };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("LLM Meal Suggestion Test Suite");
  console.log("=".repeat(60));

  const menu = createMockMenu();

  const testSuites: TestSuite[] = [
    {
      name: "Basic - No restrictions",
      prefs: createMockPreferences(),
    },
    {
      name: "Vegetarian",
      prefs: createMockPreferences({ dietaryFilter: "vegetarian" }),
    },
    {
      name: "Halal required",
      prefs: createMockPreferences({ isHalal: true }),
    },
    {
      name: "No pork, no fish",
      prefs: createMockPreferences({ excludedProteins: ["pork", "fish"] }),
    },
    {
      name: "High protein target",
      prefs: createMockPreferences({ targetProtein: 180, targetCalories: 2200 }),
    },
    {
      name: "With feedback - no cottage cheese",
      prefs: createMockPreferences(),
      feedback: "I don't like cottage cheese. Please don't include it.",
    },
    {
      name: "With feedback - more greens",
      prefs: createMockPreferences(),
      feedback: "I want more vegetables and greens in my meals.",
    },
  ];

  const approaches: LLMApproach[] = ["v1", "v2", "v3"];
  const allResults: Awaited<ReturnType<typeof runTest>>[] = [];

  // Run a subset of tests to keep it manageable
  for (const approach of approaches) {
    for (const suite of testSuites.slice(0, 4)) { // Run first 4 suites per approach
      const result = await runTest(approach, menu, suite);
      allResults.push(result);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const summary: Record<string, { passed: number; failed: number; errors: number }> = {};

  for (const approach of approaches) {
    summary[approach] = { passed: 0, failed: 0, errors: 0 };
  }

  for (const result of allResults) {
    if (result.error) {
      summary[result.approach].errors++;
    } else if (result.allPassed) {
      summary[result.approach].passed++;
    } else {
      summary[result.approach].failed++;
    }
  }

  for (const [approach, stats] of Object.entries(summary)) {
    console.log(`\n${approach.toUpperCase()}:`);
    console.log(`  Passed: ${stats.passed}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Errors: ${stats.errors}`);
  }
}

main().catch(console.error);
