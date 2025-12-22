import { NextResponse } from "next/server";
import { scrapeAllMenusForDate, scrapeMenuForToday } from "@/lib/scraper";
import { generateMealPlan, checkLocationAvailability } from "@/lib/llmSuggestions";
import { UserPreferences } from "@/types/menu";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, preferences, userFeedback } = body as {
      date?: string;
      preferences: UserPreferences;
      userFeedback?: string;
    };

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const menu = date
      ? await scrapeAllMenusForDate(date)
      : await scrapeMenuForToday();

    // Check if selected locations have menu items
    const availability = await checkLocationAvailability(menu, preferences);
    if (!availability.available) {
      return NextResponse.json(
        {
          error: "locations_closed",
          message: "Some of your selected dining locations are closed or have no menu items available.",
          closedLocations: availability.closedLocations,
          availableLocations: availability.availableLocations,
        },
        { status: 400 }
      );
    }

    const suggestion = await generateMealPlan(menu, preferences, userFeedback);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate meal suggestions", details: String(error) },
      { status: 500 }
    );
  }
}
