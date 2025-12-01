# Architecture

This document describes the technical architecture of the UofT Meal Planner.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ MacroInput  │  │ LocationSel. │  │    DietaryFilters       │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │  DayPicker  │  │              MealPlan                    │  │
│  └─────────────┘  └──────────────────────────────────────────┘  │
│                              │                                   │
│                    localStorage (preferences)                    │
└──────────────────────────────┼───────────────────────────────────┘
                               │ POST /api/suggest
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Server (API Routes)                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    /api/suggest                          │    │
│  │  1. Receives preferences (macros, locations, filters)    │    │
│  │  2. Calls scraper to fetch menu data                     │    │
│  │  3. Runs suggestion algorithm                            │    │
│  │  4. Returns DailySuggestion                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    ▼                   ▼                        │
│           ┌──────────────┐    ┌────────────────┐                │
│           │  scraper.ts  │    │ suggestions.ts │                │
│           └──────────────┘    └────────────────┘                │
└──────────────────┼───────────────────────────────────────────────┘
                   │ HTTP requests
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│            UofT Food Services (External)                         │
│            fso.ueat.utoronto.ca                                  │
│  - Menu items with full nutritional data                        │
│  - Updated daily, 7 days available                              │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend (Client-Side)

All UI components are React client components (`"use client"`).

| Component | Purpose |
|-----------|---------|
| `page.tsx` | Main app orchestrator, manages state, calls API |
| `MacroInput.tsx` | Number inputs for calorie/protein/carb/fat targets |
| `LocationSelector.tsx` | Dropdowns to select dining hall per meal |
| `DietaryFilters.tsx` | Vegetarian/vegan toggles, allergen exclusion buttons |
| `DayPicker.tsx` | Day selection buttons (today + 6 days ahead) |
| `MealPlan.tsx` | Displays suggested meals with progress bars |

### Backend (API Routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/menu` | GET | Fetches raw menu data for a date |
| `/api/suggest` | POST | Generates meal suggestions based on preferences |

### Core Libraries

#### `scraper.ts`

Responsible for fetching and parsing menu data from UofT.

**Key Functions:**
- `scrapeAllMenusForDate(date)` - Fetches all dining hall menus for a date
- `fetchMenuReport(reportId)` - Fetches a specific location/meal report
- `parseMenuReport(html, ...)` - Extracts MenuItem objects from HTML
- `containsMeat(name)` - Determines if an item contains meat (for vegetarian filter)

**Data Flow:**
1. Fetch main page to extract report GUIDs
2. For each dining hall with 3 meals (breakfast/lunch/dinner):
   - POST to `/GetReport/{guid}` 
   - Parse HTML table rows
   - Extract nutritional data from table cells
3. Return structured `DailyMenu` object

#### `suggestions.ts`

Implements the meal suggestion algorithm.

**Key Functions:**
- `generateDailySuggestion(menu, preferences)` - Main entry point
- `generateMealSuggestion(items, meal, prefs)` - Suggests items for one meal
- `selectMealItems(items, targets, prefs)` - Greedy selection algorithm
- `filterItems(items, prefs)` - Applies dietary/allergen filters

**Algorithm:**
1. Filter items by dietary preferences and allergens
2. Sort by protein density (protein per calorie)
3. Greedily add items until ~90% of calorie target reached
4. Prioritize hitting protein target first
5. Calculate shortfall and generate suggestions if needed

## Data Models

### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  category: string;
  location: string;
  meal: "breakfast" | "lunch" | "dinner";
  date: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  allergens: string[];
}
```

### UserPreferences
```typescript
interface UserPreferences {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  breakfastLocation: string;
  lunchLocation: string;
  dinnerLocation: string;
  dietaryFilter: "all" | "vegetarian" | "vegan";
  excludedAllergens: string[];
}
```

### DailySuggestion
```typescript
interface DailySuggestion {
  date: string;
  meals: MealSuggestion[];
  dailyTotals: { calories, protein, carbs, fat };
  shortfall: {
    protein: number;
    calories: number;
    message: string | null;
  };
}
```

## State Management

- **No external state library** - React useState is sufficient
- **localStorage** - Persists user preferences between sessions
- **Server state** - Fetched fresh on each "Generate" click (no caching yet)

## Security Considerations

- No authentication required (stateless app)
- No user data stored on server
- External API calls are read-only
- No secrets or API keys needed
