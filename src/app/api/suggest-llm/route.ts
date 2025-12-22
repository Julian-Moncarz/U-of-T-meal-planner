import { NextResponse } from "next/server";
import { scrapeAllMenusForDate, scrapeMenuForToday } from "@/lib/scraper";
import { generateDailySuggestionLLM, LLMApproach } from "@/lib/llmSuggestions";
import { UserPreferences } from "@/types/menu";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      preferences,
      userFeedback,
      approach = "v1",
    } = body as {
      date?: string;
      preferences: UserPreferences;
      userFeedback?: string;
      approach?: LLMApproach;
    };

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const menu = date
      ? await scrapeAllMenusForDate(date)
      : await scrapeMenuForToday();

    const suggestion = await generateDailySuggestionLLM(menu, preferences, {
      approach,
      userFeedback,
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Failed to generate LLM suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate meal suggestions", details: String(error) },
      { status: 500 }
    );
  }
}
