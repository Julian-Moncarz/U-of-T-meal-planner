# API Reference

This document describes the API endpoints available in the UofT Meal Planner.

## Endpoints

### GET `/api/menu`

Fetches raw menu data from UofT dining halls.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | Date in YYYY-MM-DD format. Defaults to today. |

**Response:**
```json
{
  "date": "2025-12-01",
  "locations": {
    "campusone": {
      "name": "CampusOne Dining Hall",
      "meals": {
        "breakfast": [...MenuItem],
        "lunch": [...MenuItem],
        "dinner": [...MenuItem]
      }
    },
    "chestnut": { ... },
    "newcollege": { ... },
    "oakhouse": { ... },
    "robarts": { ... }
  }
}
```

**Example:**
```bash
# Get today's menu
curl http://localhost:3000/api/menu

# Get menu for specific date
curl http://localhost:3000/api/menu?date=2025-12-02
```

---

### POST `/api/suggest`

Generates meal suggestions based on user preferences using the MVP algorithm.

**Request Body:**
```json
{
  "date": "2025-12-01",
  "preferences": {
    "targetCalories": 2500,
    "targetProtein": 150,
    "targetCarbs": 300,
    "targetFat": 80,
    "breakfastLocation": "chestnut",
    "lunchLocation": "newcollege",
    "dinnerLocation": "chestnut",
    "dietaryFilter": "all",
    "excludedAllergens": [],
    "excludedProteins": ["pork", "shellfish"],
    "isHalal": false,
    "likedItemIds": ["item-123", "item-456"],
    "dislikedItemIds": [],
    "onboardingCompleted": true
  }
}
```

**Response (MVP Format):**
```json
{
  "date": "2025-12-01",
  "meals": [
    {
      "meal": "breakfast",
      "items": [
        {
          "item": {
            "id": "...",
            "name": "Cage-Free Eggs Scrambled",
            "category": "Breakfast Entree",
            "servingSize": "100g",
            "calories": 148,
            "protein": 12,
            ...
          },
          "servings": 2,
          "displayQuantity": "200g (~1.5 cups)"
        },
        {
          "item": { "name": "Fresh Fruit Salad", ... },
          "servings": 1,
          "displayQuantity": "100g (~1 cup)"
        }
      ],
      "totals": {
        "calories": 396,
        "protein": 26,
        "carbs": 24,
        "fat": 22
      }
    },
    { "meal": "lunch", ... },
    { "meal": "dinner", ... }
  ],
  "dailyTotals": {
    "calories": 2100,
    "protein": 142,
    "carbs": 180,
    "fat": 95
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "targetCalories": 2500,
      "targetProtein": 150,
      "targetCarbs": 300,
      "targetFat": 80,
      "breakfastLocation": "chestnut",
      "lunchLocation": "newcollege",
      "dinnerLocation": "chestnut",
      "dietaryFilter": "all",
      "excludedAllergens": [],
      "excludedProteins": [],
      "isHalal": false,
      "likedItemIds": [],
      "dislikedItemIds": [],
      "onboardingCompleted": true
    }
  }'
```

---

## Data Types

### MenuItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Item name |
| `category` | string | Food category (e.g., "Breakfast Entree", "Bowls") |
| `location` | string | Dining hall name |
| `meal` | string | "breakfast", "lunch", or "dinner" |
| `date` | string | Date in YYYY-MM-DD format |
| `servingSize` | string | Portion size (e.g., "100g", "Each") |
| `calories` | number | Calories per serving |
| `protein` | number | Protein in grams |
| `carbs` | number | Carbohydrates in grams |
| `fat` | number | Fat in grams |
| `fiber` | number | Fiber in grams |
| `sugar` | number | Sugar in grams |
| `sodium` | number | Sodium in milligrams |
| `isVegetarian` | boolean | Whether item is vegetarian |
| `isVegan` | boolean | Whether item is vegan |
| `isHalal` | boolean | Whether item is halal |
| `allergens` | string[] | List of allergens |

### UserPreferences

| Field | Type | Description |
|-------|------|-------------|
| `targetCalories` | number | Daily calorie target |
| `targetProtein` | number | Daily protein target (grams) |
| `targetCarbs` | number | Daily carb target (grams) |
| `targetFat` | number | Daily fat target (grams) |
| `breakfastLocation` | string | Location ID for breakfast |
| `lunchLocation` | string | Location ID for lunch |
| `dinnerLocation` | string | Location ID for dinner |
| `dietaryFilter` | string | "all", "vegetarian", or "vegan" |
| `excludedAllergens` | string[] | Allergens to avoid |
| `excludedProteins` | string[] | Protein types to avoid |
| `isHalal` | boolean | Only show halal items |
| `likedItemIds` | string[] | IDs of preferred items |
| `dislikedItemIds` | string[] | IDs of items to avoid |
| `onboardingCompleted` | boolean | Whether user completed onboarding |
| `bodyStats` | BodyStats? | Optional body stats for macro calculation |

### SelectedItem (MVP)

| Field | Type | Description |
|-------|------|-------------|
| `item` | MenuItem | The menu item |
| `servings` | number | Number of servings (e.g., 2) |
| `displayQuantity` | string | Human-readable quantity (e.g., "200g (~1.5 cups)") |

### Location IDs

| ID | Name |
|----|------|
| `campusone` | CampusOne Dining Hall |
| `chestnut` | Chestnut Residence |
| `newcollege` | New College Dining Hall |
| `oakhouse` | Oak House Dining Hall |
| `robarts` | Robarts Cafeteria |

### Protein Exclusion Options

Available values for `excludedProteins`:
- `fish` - salmon, tuna, cod, etc.
- `pork` - pork, bacon, ham, sausage, etc.
- `beef` - beef, steak, burger, etc.
- `shellfish` - shrimp, crab, lobster, etc.
- `tofu`
- `lamb`

### Allergen Options

Available values for `excludedAllergens`:
- `gluten`
- `sesame`
- `soy`
- `peanuts`
- `mustard`
- `milk`
- `shellfish`
- `fish`
- `egg`
- `treenuts`
- `sulphites`
- `wheat`

---

## Error Responses

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch menu data"
}
```

**400 Bad Request**
```json
{
  "error": "Preferences are required"
}
```
