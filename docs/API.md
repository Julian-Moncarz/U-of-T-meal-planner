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

Generates meal suggestions based on user preferences.

**Request Body:**
```json
{
  "date": "2025-12-01",  // Optional, defaults to today
  "preferences": {
    "targetCalories": 2800,
    "targetProtein": 160,
    "targetCarbs": 350,
    "targetFat": 90,
    "breakfastLocation": "chestnut",
    "lunchLocation": "newcollege",
    "dinnerLocation": "chestnut",
    "dietaryFilter": "vegetarian",  // "all" | "vegetarian" | "vegan"
    "excludedAllergens": ["gluten", "peanuts"]
  }
}
```

**Response:**
```json
{
  "date": "2025-12-01",
  "meals": [
    {
      "meal": "breakfast",
      "items": [
        {
          "id": "...",
          "name": "Cage-Free Eggs Scrambled",
          "category": "Breakfast Entree",
          "location": "Chestnut Residence",
          "meal": "breakfast",
          "date": "2025-12-01",
          "servingSize": "100g",
          "calories": 148,
          "protein": 12,
          "carbs": 2,
          "fat": 9.09,
          "fiber": 0,
          "sugar": 0,
          "sodium": 130,
          "isVegetarian": true,
          "isVegan": false,
          "isHalal": false,
          "allergens": []
        }
      ],
      "totals": {
        "calories": 663,
        "protein": 41,
        "carbs": 55,
        "fat": 28
      }
    },
    { "meal": "lunch", ... },
    { "meal": "dinner", ... }
  ],
  "dailyTotals": {
    "calories": 2500,
    "protein": 184,
    "carbs": 148,
    "fat": 131
  },
  "shortfall": {
    "protein": 0,
    "calories": 300,
    "message": null
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "targetCalories": 2800,
      "targetProtein": 160,
      "targetCarbs": 350,
      "targetFat": 90,
      "breakfastLocation": "chestnut",
      "lunchLocation": "newcollege",
      "dinnerLocation": "chestnut",
      "dietaryFilter": "vegetarian",
      "excludedAllergens": []
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
| `category` | string | Food category (e.g., "Breakfast Entree") |
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
| `allergens` | string[] | List of allergens (currently empty) |

### Location IDs

| ID | Name |
|----|------|
| `campusone` | CampusOne Dining Hall |
| `chestnut` | Chestnut Residence |
| `newcollege` | New College Dining Hall |
| `oakhouse` | Oak House Dining Hall |
| `robarts` | Robarts Cafeteria |

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
