"use client";

import { DailySuggestion, MealSuggestion } from "@/types/menu";

interface MacroProgressProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

function MacroProgress({ label, current, target, unit = "g", color = "blue" }: MacroProgressProps) {
  const percentage = Math.min(100, (current / target) * 100);
  const isOver = current > target;
  
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
  };
  
  return (
    <div className="flex-1">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={isOver ? "text-red-600" : "text-gray-600"}>
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isOver ? "bg-red-500" : colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

interface MealCardProps {
  suggestion: MealSuggestion;
}

function MealCard({ suggestion }: MealCardProps) {
  const mealEmoji = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
        <span>{mealEmoji[suggestion.meal]}</span>
        {suggestion.meal}
      </h4>
      
      {suggestion.items.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No items available for this meal</p>
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {suggestion.items.map((item) => (
              <li key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-500 ml-2">({item.servingSize})</span>
                  {item.isVegan && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Vegan
                    </span>
                  )}
                  {item.isVegetarian && !item.isVegan && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Veg
                    </span>
                  )}
                </div>
                <div className="text-right text-gray-600 ml-4">
                  <div>{item.calories} cal</div>
                  <div className="text-xs">{item.protein}g protein</div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="border-t pt-3 grid grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-800">{Math.round(suggestion.totals.calories)}</div>
              <div className="text-xs text-gray-500">cal</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800">{Math.round(suggestion.totals.protein)}g</div>
              <div className="text-xs text-gray-500">protein</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800">{Math.round(suggestion.totals.carbs)}g</div>
              <div className="text-xs text-gray-500">carbs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800">{Math.round(suggestion.totals.fat)}g</div>
              <div className="text-xs text-gray-500">fat</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface MealPlanProps {
  suggestion: DailySuggestion | null;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  loading?: boolean;
}

export function MealPlan({ suggestion, targets, loading }: MealPlanProps) {
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Generating your meal plan...</p>
      </div>
    );
  }
  
  if (!suggestion) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-600">Set your preferences and click &quot;Generate Meal Plan&quot; to get started</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Daily Progress</h3>
        <div className="flex gap-4">
          <MacroProgress
            label="Calories"
            current={suggestion.dailyTotals.calories}
            target={targets.calories}
            unit="kcal"
            color="blue"
          />
          <MacroProgress
            label="Protein"
            current={suggestion.dailyTotals.protein}
            target={targets.protein}
            color="green"
          />
          <MacroProgress
            label="Carbs"
            current={suggestion.dailyTotals.carbs}
            target={targets.carbs}
            color="yellow"
          />
          <MacroProgress
            label="Fat"
            current={suggestion.dailyTotals.fat}
            target={targets.fat}
            color="red"
          />
        </div>
      </div>
      
      {suggestion.shortfall.message && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <span className="font-medium">💡 Tip: </span>
          {suggestion.shortfall.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestion.meals.map((meal) => (
          <MealCard key={meal.meal} suggestion={meal} />
        ))}
      </div>
    </div>
  );
}
