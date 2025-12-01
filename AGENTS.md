# UofT Meal Planner

A Next.js web app that helps University of Toronto students plan meals across campus dining halls to hit their daily macro targets.

## Core Commands

- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Build for production: `npm run build`
- Run linter: `npm run lint`
- Type check: `npx tsc --noEmit`

## Project Layout

```
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── menu/           # GET endpoint - fetches menu data from UofT
│   │   │   └── suggest/        # POST endpoint - generates meal suggestions
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Main app page (client component)
│   ├── components/             # React UI components
│   │   ├── MacroInput.tsx      # Macro target input fields
│   │   ├── LocationSelector.tsx # Dining hall selection dropdowns
│   │   ├── DietaryFilters.tsx  # Vegetarian/vegan/allergen toggles
│   │   ├── DayPicker.tsx       # Day selection (today + 7 days)
│   │   └── MealPlan.tsx        # Meal plan display with progress bars
│   ├── lib/                    # Core business logic
│   │   ├── scraper.ts          # UofT menu scraper (fetches from fso.ueat.utoronto.ca)
│   │   └── suggestions.ts      # Meal suggestion algorithm
│   └── types/                  # TypeScript type definitions
│       └── menu.ts             # MenuItem, UserPreferences, DailySuggestion types
├── public/                     # Static assets
└── package.json
```

## Development Patterns & Constraints

### Data Flow
1. User sets preferences (macros, locations, dietary filters) → saved to localStorage
2. User clicks "Generate Meal Plan" → POST to `/api/suggest`
3. API scrapes UofT menu portal for the selected date
4. Suggestion algorithm selects items prioritizing protein targets
5. Results displayed with progress bars showing actual vs target macros

### Scraper Architecture
- The scraper fetches from `https://fso.ueat.utoronto.ca/FSO/ServiceMenuReport/`
- Each dining hall/meal combination has a unique GUID
- Main page is fetched first to extract GUIDs, then each report is fetched via POST
- Menu items are parsed from HTML tables using Cheerio

### Vegetarian Detection
- Items are marked vegetarian if they do NOT contain meat keywords
- Meat keywords include: chicken, beef, pork, fish, surimi, shrimp, etc.
- Plant-based alternatives (Impossible, Beyond) are correctly identified as vegetarian
- Do NOT rely on item name containing "vegetable" - check for absence of meat

### Key Files to Understand
- `src/lib/scraper.ts` - All UofT menu fetching logic
- `src/lib/suggestions.ts` - Meal selection algorithm (greedy, protein-prioritized)
- `src/types/menu.ts` - All TypeScript interfaces and constants

## External Services

- **UofT Food Services API**: `https://fso.ueat.utoronto.ca/FSO/ServiceMenuReport/`
  - No API key required
  - Menu data available 7 days ahead
  - Includes full nutritional info (calories, protein, carbs, fat, etc.)

## Conventions

- Use TypeScript strict mode
- Components are client-side (`"use client"` directive)
- API routes are server-side (no directive needed)
- Tailwind CSS for styling
- No external state management - localStorage for persistence

## Git Workflow

1. Make changes on feature branches
2. Run `npm run lint` and `npm run build` before committing
3. Commit messages should be descriptive (feat:, fix:, docs:, etc.)

## Common Tasks

### Adding a New Dining Location
1. Add to `LOCATIONS` constant in `src/types/menu.ts`
2. Update `extractMenuReports()` in `src/lib/scraper.ts` to include the GUID mapping

### Adding New Allergen/Dietary Filters
1. Add to `ALLERGENS` array in `src/types/menu.ts`
2. Update `DietaryFilters.tsx` component if UI changes needed
3. Update `filterItems()` in `src/lib/suggestions.ts`

### Improving Vegetarian Detection
- Add meat keywords to `containsMeat()` function in `src/lib/scraper.ts`
- Test with items that contain both meat and vegetable words (e.g., "Chicken And Vegetable Dumplings")
