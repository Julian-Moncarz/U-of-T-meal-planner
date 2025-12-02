# UofT Meal Planner

A web app that helps University of Toronto students plan their daily meals across campus dining halls to hit their macro (protein, carbs, fat, calories) targets.

## Features

- **Personalized Onboarding**: 6-screen flow to set up your macro targets, dining locations, and dietary preferences
- **Smart Suggestions**: MVP algorithm picks high-protein items and calculates servings to hit your targets
- **Multiple Dining Halls**: Support for CampusOne, Chestnut, New College, Oak House, and Robarts
- **Dietary Filters**: Vegetarian, vegan, halal, allergen exclusion, and protein type exclusions
- **Quantity Display**: Shows servings with human-readable quantities (e.g., "300g (~2 cups)")
- **Time-Based UI**: Meal accordion auto-opens to the current meal (breakfast/lunch/dinner)
- **Preference Learning**: Mark items you like during onboarding to get better suggestions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Julian-Moncarz/U-of-T-meal-planner.git
cd uoft-meal-planner

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## How It Works

1. **First Visit**: Complete the onboarding flow (macros, locations, dietary restrictions, food preferences)
2. **View Your Plan**: Main page shows today's meal suggestions with quantities
3. **Time-Aware**: The current meal (based on time of day) is expanded by default
4. **Daily Totals**: See your projected calories and protein at the bottom

### Onboarding Flow

1. **Welcome** - Introduction to the app
2. **Macros** - Set calorie and protein targets (or use calculator)
3. **Locations** - Pick dining halls for breakfast, lunch, dinner
4. **Dietary Restrictions** - Vegetarian/vegan, halal, allergens, excluded proteins
5. **Food Preferences** - Select items you'd actually eat from the real menu
6. **Done** - Redirected to main app with your first meal plan

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Data Source**: UofT Food Services nutrition portal (live scraping)
- **Storage**: localStorage (no backend/auth required)

## Data Source

Menu and nutritional data is scraped live from the [UofT Food Services nutrition portal](https://fso.ueat.utoronto.ca/FSO/ServiceMenuReport/Today). The data includes:

- Full nutritional breakdown (calories, protein, carbs, fat, fiber, sugar, sodium)
- Serving sizes
- Dietary tags (vegetarian, vegan, halal)
- Daily menu updates

## Supported Dining Halls

| Location | Meals Available |
|----------|-----------------|
| CampusOne Dining Hall | Breakfast, Lunch, Dinner |
| Chestnut Residence | Breakfast, Lunch, Dinner |
| New College Dining Hall | Breakfast, Lunch, Dinner |
| Oak House Dining Hall | Breakfast, Lunch, Dinner |
| Robarts Cafeteria | Breakfast, Lunch, Dinner |

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main app (auto-fetches suggestions)
│   ├── onboarding/        # 6-screen onboarding flow
│   └── api/
│       ├── menu/          # GET raw menu data
│       └── suggest/       # POST get meal suggestions
├── components/
│   ├── MealAccordion.tsx  # Main meal display component
│   ├── MacroInput.tsx     # Macro target inputs
│   ├── LocationSelector.tsx
│   └── DietaryFilters.tsx
├── lib/
│   ├── scraper.ts         # UofT menu scraper
│   └── suggestions.ts     # MVP recommendation algorithm
└── types/
    └── menu.ts            # TypeScript interfaces
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](docs/API.md) - API endpoints and data types
- [Onboarding & Preferences](docs/ONBOARDING_AND_PREFERENCES.md) - Onboarding flow and algorithm details

## Deployment

This app is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com/new)
3. Vercel will auto-detect Next.js and deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Run linting (`npm run lint`)
4. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This app is not affiliated with the University of Toronto. Menu items and nutritional information are sourced from UofT Food Services and may vary. Always check with dining staff for the most accurate information, especially regarding allergens.
