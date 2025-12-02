# Architecture

This document describes the technical architecture of the UofT Meal Planner.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Onboarding Flow                        │   │
│  │  Welcome → Macros → Locations → Dietary → Preferences     │   │
│  │                  (first-time users)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Main App (/)                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              MealAccordion Component               │  │   │
│  │  │   Breakfast | Lunch | Dinner (time-based default)  │  │   │
│  │  │   Shows items with quantities (e.g., "300g ~2 cups")│  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                    localStorage (preferences)                    │
└──────────────────────────────┼───────────────────────────────────┘
                               │ POST /api/suggest (auto on load)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Server (API Routes)                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    /api/suggest                          │    │
│  │  1. Receives preferences from localStorage               │    │
│  │  2. Calls scraper to fetch menu data                     │    │
│  │  3. Runs MVP suggestion algorithm                        │    │
│  │  4. Returns DailySuggestionMVP with quantities           │    │
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

## User Flow

1. **First Visit**: User lands on `/` → redirected to `/onboarding`
2. **Onboarding**: 6-screen flow collects preferences → saves to localStorage
3. **Main App**: Auto-fetches suggestions on load → displays in MealAccordion
4. **Return Visit**: Preferences loaded from localStorage → skips onboarding

## Core Components

### Pages

| Page | Purpose |
|------|---------|
| `/` (`page.tsx`) | Main app - displays meal suggestions, auto-fetches on load |
| `/onboarding` | 6-screen onboarding flow for first-time users |

### Components

| Component | Purpose |
|-----------|---------|
| `MealAccordion.tsx` | Expandable sections for breakfast/lunch/dinner with items and quantities |
| `MacroInput.tsx` | Number inputs for calorie/protein targets (used in onboarding) |
| `LocationSelector.tsx` | Dropdown to select dining hall (used in onboarding) |
| `DietaryFilters.tsx` | Dietary restriction toggles (used in onboarding) |

### Backend (API Routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/menu` | GET | Fetches raw menu data for a date |
| `/api/suggest` | POST | Generates meal suggestions using MVP algorithm |

## Core Libraries

### `scraper.ts`

Fetches and parses menu data from UofT Food Services.

**Key Functions:**
- `scrapeAllMenusForDate(date)` - Fetches all dining hall menus for a date
- `scrapeMenuForToday()` - Convenience wrapper for today's date
- `parseMenuReport(html, ...)` - Extracts MenuItem objects from HTML

**Data Flow:**
1. Fetch main page to extract report GUIDs
2. For each dining hall × meal (breakfast/lunch/dinner):
   - POST to `/GetReport/{guid}` 
   - Parse HTML table rows
   - Extract nutritional data from table cells
3. Return structured `DailyMenu` object

### `suggestions.ts`

Implements the MVP meal suggestion algorithm.

**Key Functions:**
- `generateDailySuggestionMVP(menu, preferences)` - Main entry point
- `generateMealSuggestionMVP(items, meal, prefs)` - Suggests items for one meal
- `selectMealItemsMVP(items, targets, prefs)` - Selection with servings calculation
- `formatServingSize(item, servings)` - Converts mass to display string (e.g., "300g (~2 cups)")

**MVP Algorithm:**
1. Filter items by dietary preferences (vegan/vegetarian, halal, excluded proteins)
2. Select 1 main protein item from high-protein categories (Bowls, Burritos, Grill, Entrees)
3. Prefer items from user's liked items list
4. Calculate servings needed to hit ~80% of per-meal protein target
5. Add 1 side item (Salad Bar, Soup)
6. Return items with servings and display quantities

**Category Classifications:**
```typescript
MAIN_CATEGORIES = ["Bowls", "Burritos", "Grill", "Dinner Entree", "Lunch Entree", ...]
SIDE_CATEGORIES = ["Salad Bar", "Soup", "Sides and More", ...]
```

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
  // Macro targets
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  
  // Dining locations
  breakfastLocation: string;
  lunchLocation: string;
  dinnerLocation: string;
  
  // Dietary restrictions
  dietaryFilter: "all" | "vegetarian" | "vegan";
  excludedAllergens: string[];
  excludedProteins: string[];  // ["fish", "pork", "tofu", ...]
  isHalal: boolean;
  
  // Body stats (optional - if user used calculator)
  bodyStats?: BodyStats;
  
  // Preference learning
  likedItemIds: string[];      // from onboarding
  dislikedItemIds: string[];   // from swaps (future)
  
  // Onboarding state
  onboardingCompleted: boolean;
}
```

### DailySuggestionMVP
```typescript
interface DailySuggestionMVP {
  date: string;
  meals: MealSuggestionMVP[];
  dailyTotals: { calories, protein, carbs, fat };
}

interface MealSuggestionMVP {
  meal: "breakfast" | "lunch" | "dinner";
  items: SelectedItem[];
  totals: { calories, protein, carbs, fat };
}

interface SelectedItem {
  item: MenuItem;
  servings: number;           // e.g., 2
  displayQuantity: string;    // e.g., "300g (~2 cups)"
}
```

## State Management

- **No external state library** - React useState/useEffect
- **localStorage** - Persists user preferences between sessions
  - Key: `mealPlannerPreferences`
- **Auto-fetch** - Suggestions fetched automatically on page load (no manual button)

## UI/UX Details

### Design System
- **Fonts**: Playfair Display (italic headings), Lato (body text)
- **Colors**: Black (#0D0D0D) on cream (#FAF9F6)
- **Decorative corners**: SVG corner flourishes on main container

### Time-Based Default Meal
MealAccordion opens the current meal section based on time:
- Before 11am → Breakfast open
- 11am-4pm → Lunch open
- After 4pm → Dinner open

### Quantity Display
Items show servings when > 1:
- Single serving: "Grilled Chicken Breast"
- Multiple servings: "Halal Chicken Sausage — 300g (~2 cups)"

## Security Considerations

- No authentication required (stateless app)
- No user data stored on server
- All data persisted in browser localStorage
- External API calls are read-only
- No secrets or API keys needed
