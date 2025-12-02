# User Onboarding & Preferences System

## Overview
How the app learns what users like to eat and generates personalized meal plans.

## Core Philosophy
- Onboarding should feel like the app is getting to know you, not filling out forms
- Minimize upfront friction, but make it feel valuable
- Learn implicitly from user behavior (swaps) over time
- End onboarding with an actual meal plan - immediate payoff

## Information We Need From Users

### Required for Meal Generation
1. **Macro Targets** - calories, protein, carbs, fat
2. **Dining Hall Locations** - where they eat breakfast/lunch/dinner
3. **Dietary Restrictions** - vegetarian/vegan, allergens, halal
4. **Protein Exclusions** - proteins they won't eat (fish, pork, tofu, etc.)

### For Better Personalization
5. **Initial Food Preferences** - items they'd actually eat (from real menu)
6. **Learned Preferences** - built over time from swap behavior

## Macro Calculation
- Option 1: User enters their own macros ("I know my macros")
- Option 2: Calculate from body stats (weight, height, age, sex, activity level, goal)
- Use Mifflin-St Jeor formula for BMR, adjust for activity + goal

---

## Onboarding Flow (6 Screens)

### Screen 1: Welcome
**Purpose:** Set expectations, build excitement

**Copy:**
- Headline: "Hit your macros without thinking"
- Body: "Every morning, we'll show you exactly what to eat at the dining hall to hit your macros. No thinking required."
- CTA: "Let's set you up"

---

### Screen 2: Macro Targets
**Purpose:** Establish nutritional goals

**Two paths:**
1. **Calculator (default):** Body stats form → shows calculated recommendation
2. **Manual entry:** "I know my macros" button → direct input

**Calculator copy:**
- Headline: "Let's figure out your targets"
- After calculation: "Based on this, we recommend [X] calories and [Y]g protein per day. You'll need about [Z]g protein per meal."
- "Adjust if needed" option

**Manual entry copy:**
- Headline: "Enter your daily targets"

---

### Screen 3: Dining Locations
**Purpose:** Learn their routine

**Copy:**
- Headline: "Where do you usually eat?"
- Subhead: "We'll pull menus from these spots"
- Labels: "Breakfast at...", "Lunch at...", "Dinner at..."

---

### Screen 4: Hard No's
**Purpose:** Respect their boundaries, avoid bad suggestions

**Copy:**
- Headline: "Anything you won't eat?"
- Subhead: "We'll keep these out of your meal plans"

**Sections:**
- "Proteins to avoid" - fish, pork, tofu, shellfish, beef, etc.
- "Allergens" - gluten, dairy, nuts, etc.
- "Diet type" - All / Vegetarian / Vegan
- "Halal only" toggle

---

### Screen 5: What Sounds Good
**Purpose:** Build initial taste profile from REAL menu items

**Copy:**
- Headline: "What would you actually eat?"
- Subhead: "Tap the items that sound good to you"
- Footer: "This helps us suggest meals you'll actually want"

**Behavior:**
- Show 6-8 high-protein items from tomorrow's actual menu
- User taps to select (multi-select, toggle on/off)
- Mix of categories: bowls, burritos, grill items, entrees

---

### Screen 6: Your First Plan
**Purpose:** Immediate payoff, transition to app

**Copy:**
- Headline: "You're all set"
- Subhead: "Here's your meal plan for tomorrow"
- Show preview: breakfast, lunch, dinner with macro totals
- Tip: "Tap any item to swap it for something else"
- CTA: "Let's go"

---

## Preference Learning (Future)

### Signals We Can Capture
- Items kept vs. swapped
- Items selected when swapping
- "Add another serving" actions
- Time spent considering items

### How Preferences Affect Suggestions
- Weight items similar to kept/liked items higher
- Deprioritize items similar to frequently swapped items
- Consider category preferences (user keeps bowls, swaps salads)

---

## Swapping System (Future)

### Core Concept
When user taps an item, show alternatives that still keep them on track for macros.

### Swap Constraints
- Replacement should keep user on track for macro targets
- Show macro impact of swap
- Allow multiple servings of same item

### Swap Scenarios
- "I don't want this specific item" → show alternatives with similar macros
- "I'm eating somewhere else for lunch" → regenerate just that meal
- "I already ate X" → recalculate remaining meals to compensate

---

## Data Model

### Current UserPreferences (in types/menu.ts)
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

### Proposed Additions
```typescript
interface UserPreferences {
  // ... existing fields ...
  
  // Body stats (optional - if they used calculator)
  bodyStats?: {
    weight: number;      // lbs
    height: number;      // inches
    age: number;
    sex: "male" | "female";
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
    goal: "lose" | "maintain" | "gain";
  };
  
  // Protein exclusions
  excludedProteins: string[];  // ["fish", "pork", "tofu", "shellfish", ...]
  
  // Halal preference
  isHalal: boolean;
  
  // Preference learning
  likedItemIds: string[];      // from onboarding + kept items
  dislikedItemIds: string[];   // from swapped items
  
  // Onboarding state
  onboardingCompleted: boolean;
}
```

---

## Menu Data Context

### Available Categories (~30)
- **Protein-forward:** Bowls, Burritos, Grill, Dinner/Lunch Entree, Pan Station
- **Carb-focused:** Pizza, Pasta Bar, Hot/Cold Cereal, Toast Station
- **Light/Sides:** Salad Bar, Soup, Breakfast Cold Pantry, Dessert
- **Customizable:** Burrito Toppings, Bowl Toppings

### Volume
- 80-120 items per meal at main dining halls (CampusOne, Chestnut, New College, Oak House)
- ~30 items at Robarts
- Menus change daily

### High Protein Items (examples)
- Burritos: 30-36g protein
- Bowls (chicken/beef): 25-30g
- Scrambled eggs: 12g per serving
- Soy beans: 35g (breakfast)

### Key Proteins in Menu
Chicken, beef, pork, fish (salmon, tuna), tofu, eggs, plant-based alternatives (Impossible, Beyond)

---

## Technical Notes

### Storage
- localStorage for MVP (no auth yet)
- Key: `mealPlannerPreferences`
- Future: Supabase with Google OAuth

### Onboarding Detection
- Check for `onboardingCompleted` flag on app load
- If false/missing → redirect to `/onboarding`
- After completion → redirect to main page

### Onboarding State Management
- Store progress in component state during flow
- Only persist to localStorage on final screen completion
- Allow back navigation without losing progress
