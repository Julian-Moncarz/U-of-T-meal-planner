# UofT Meal Planner

A web app that helps University of Toronto students plan their daily meals across campus dining halls to hit their macro (protein, carbs, fat, calories) targets.

![UofT Meal Planner Screenshot](docs/screenshot.png)

## Features

- **Macro Tracking**: Set daily targets for calories, protein, carbs, and fat
- **Multiple Dining Halls**: Support for CampusOne, Chestnut, New College, Oak House, and Robarts
- **Dietary Filters**: Vegetarian, vegan, and allergen exclusion options
- **7-Day Planning**: View menus and plan meals up to a week ahead
- **Smart Suggestions**: Algorithm prioritizes protein-dense items to help hit targets
- **Progress Visualization**: See how close your meal plan gets to your daily goals
- **Shortfall Alerts**: Get suggestions when dining hall options fall short of targets

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/uoft-meal-planner.git
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

1. **Set Your Targets**: Enter your daily macro goals (e.g., 2800 cal, 160g protein)
2. **Choose Locations**: Select which dining hall you'll eat at for each meal
3. **Apply Filters**: Toggle vegetarian/vegan mode or exclude allergens
4. **Generate Plan**: Click to get a suggested meal plan that maximizes protein intake
5. **Review & Adjust**: See progress bars showing how close you are to targets

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Data Source**: UofT Food Services nutrition portal

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
