# CLAUDE.md

This file provides guidance to Claude Code when working on this repository.

## Project Overview

UofT Meal Planner is a Next.js web app that helps University of Toronto students plan meals across campus dining halls to hit their daily macro targets. It scrapes menu data from UofT Food Services and uses an LLM to generate personalized meal suggestions.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npx tsc --noEmit` - Type check

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── menu/route.ts   # GET - fetches menu data
│   │   └── suggest/route.ts # POST - generates suggestions via LLM
│   ├── onboarding/         # 6-screen onboarding flow
│   ├── settings/           # User settings page
│   └── page.tsx            # Main app (displays meal suggestions)
├── components/             # React components
├── lib/
│   ├── scraper.ts          # UofT menu scraper (Cheerio)
│   ├── llmSuggestions.ts   # LLM-based meal suggestions (Anthropic SDK)
│   ├── storage.ts          # localStorage helpers
│   └── constants.ts        # App constants
└── types/
    └── menu.ts             # TypeScript interfaces
```

## Key Patterns

- **Client components** use `"use client"` directive; API routes are server-side
- **State persistence** via localStorage (key: `mealPlannerPreferences`)
- **Auto-fetch** suggestions on page load (no manual button)
- **Time-based UI** - MealAccordion opens current meal based on time of day

## Data Flow

1. User preferences saved to localStorage during onboarding
2. Main page auto-fetches POST `/api/suggest` with preferences
3. API scrapes UofT menu portal (`fso.ueat.utoronto.ca`)
4. LLM generates meal suggestions based on menu + preferences
5. Results cached in localStorage for same-day repeat visits

## External Dependencies

- **UofT Food Services**: `https://fso.ueat.utoronto.ca/FSO/ServiceMenuReport/` (no API key)
- **Anthropic SDK**: Used for LLM-based meal suggestions

## Conventions

- TypeScript strict mode enabled
- Tailwind CSS for styling
- Vitest for testing
- Run `npm run lint` and `npm run build` before committing
