import { NextResponse } from "next/server";
import { scrapeAllMenusForDate, scrapeMenuForToday } from "@/lib/scraper";
import { generateDailySuggestionMVP } from "@/lib/suggestions";
import { UserPreferences } from "@/types/menu";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, preferences } = body as { date?: string; preferences: UserPreferences };
    
    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required" },
        { status: 400 }
      );
    }
    
    const menu = date 
      ? await scrapeAllMenusForDate(date)
      : await scrapeMenuForToday();
    
    const suggestion = generateDailySuggestionMVP(menu, preferences);
    
    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate meal suggestions" },
      { status: 500 }
    );
  }
}
