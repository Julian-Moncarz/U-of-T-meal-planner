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
    // Exclude specific item IDs
    if (excludeIds.includes(item.id)) return false;
    
    // Exclude disliked items
    if (prefs.dislikedItemIds?.includes(item.id)) return false;
    
    // Dietary filter
    if (prefs.dietaryFilter === "vegetarian" && !item.isVegetarian) return false;
    if (prefs.dietaryFilter === "vegan" && !item.isVegan) return false;
    
    // Halal filter
    if (prefs.isHalal && !item.isHalal) return false;
    
    // Allergen filter
    for (const allergen of prefs.excludedAllergens) {
      if (item.allergens.includes(allergen)) return false;
    }
    
    // Excluded proteins filter
    if (containsExcludedProtein(item.name, prefs.excludedProteins)) return false;
    
    return true;
  });
}

function calculateProteinDensity(item: MenuItem): number {
  if (item.calories === 0) return 0;
  return item.protein / item.calories;
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const menu = date 
      ? await scrapeAllMenusForDate(date)
      : await scrapeMenuForToday();
    
    const location = menu.locations[locationId];
    if (!location || !location.meals[mealType]) {
      return NextResponse.json({ alternatives: [] });
    }
    
    const allItems = location.meals[mealType];
    const filtered = filterItems(allItems, preferences, [currentItemId]);
    
    // Sort by protein density
    const sorted = filtered.sort((a, b) => calculateProteinDensity(b) - calculateProteinDensity(a));
    
    return NextResponse.json({ alternatives: sorted });
  } catch (error) {
    console.error("Failed to get swap options:", error);
    return NextResponse.json(
      { error: "Failed to get swap options" },
      { status: 500 }
    );
  }
}
