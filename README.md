# UofT Meal Planner

I use the UofT meal plan, but it was too much effort to plan meals that hit my macros. This site solves that: given desired macros, dietary preferences, and dining locations, it generates a custom menu for each day (by passing that info along with the menu to an LLM). Once setup is done, you just open the site and have a personalized meal plan ready that hits your macros.

<img width="409" height="857" alt="Screenshot 2026-01-06 at 6 51 42 PM" src="https://github.com/user-attachments/assets/657af7cb-bea4-45f3-be48-1ca112add4f6" />


## Data Source

Menu and nutritional data is scraped from the [UofT Food Services nutrition portal](https://fso.ueat.utoronto.ca/FSO/ServiceMenuReport/Today).

## API Costs

Meal plans are generated using Claude Haiku 4.5 (`claude-haiku-4-5-20251001`).

| Metric | Value |
|--------|-------|
| API calls per generation | 1 |
| Input tokens (typical) | 1,700 - 2,700 |
| Output tokens (typical) | 150 - 350 |
| **Cost per meal plan** | **$0.0025 - $0.0045** |
| Cost per 1,000 plans | $2.50 - $4.50 |

Token usage varies based on menu size (number of items available at each dining location). Same-day repeat visits are cached and don't incur additional API costs.
