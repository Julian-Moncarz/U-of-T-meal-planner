import { NextResponse } from "next/server";
import { scrapeAllMenusForDate, scrapeMenuForToday } from "@/lib/scraper";
import { UserPreferences, MenuItem } from "@/types/menu";

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

function filterItems(items: MenuItem[], prefs: UserPreferences, excludeIds: string[]): MenuItem[] {
  return items.filter(item => {
    if (excludeIds.includes(item.id)) return false;
    if (prefs.dislikedItemIds?.includes(item.id)) return false;
    if (prefs.dietaryFilter === "vegetarian" && !item.isVegetarian) return false;
    if (prefs.dietaryFilter === "vegan" && !item.isVegan) return false;
    // Halal: item is safe if explicitly halal OR vegetarian/vegan
    if (prefs.isHalal && !item.isHalal && !item.isVegetarian && !item.isVegan) return false;
    for (const allergen of prefs.excludedAllergens) {
      if (item.allergens.includes(allergen)) return false;
    }
    if (containsExcludedProtein(item.name, prefs.excludedProteins)) return false;
    return true;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, mealType, locationId, currentItemId, preferences } = body as {
      date?: string;
      mealType: "breakfast" | "lunch" | "dinner";
      locationId: string;
      currentItemId: string;
      preferences: UserPreferences;
    };

    if (!mealType || !locationId || !currentItemId || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const menu = date ? await scrapeAllMenusForDate(date) : await scrapeMenuForToday();

    const location = menu.locations[locationId];
    if (!location || !location.meals[mealType]) {
      return NextResponse.json({ alternatives: [] });
    }

    const filtered = filterItems(location.meals[mealType], preferences, [currentItemId]);

    // Sort by protein density
    const sorted = filtered.sort((a, b) => {
      const densityA = a.calories > 0 ? a.protein / a.calories : 0;
      const densityB = b.calories > 0 ? b.protein / b.calories : 0;
      return densityB - densityA;
    });

    return NextResponse.json({ alternatives: sorted });
  } catch (error) {
    console.error("Failed to get swap options:", error);
    return NextResponse.json({ error: "Failed to get swap options" }, { status: 500 });
  }
}
