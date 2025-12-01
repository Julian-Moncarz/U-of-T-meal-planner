"use client";

import { ALLERGENS } from "@/types/menu";

interface DietaryFiltersProps {
  dietaryFilter: "all" | "vegetarian" | "vegan";
  excludedAllergens: string[];
  onDietaryFilterChange: (value: "all" | "vegetarian" | "vegan") => void;
  onAllergensChange: (allergens: string[]) => void;
}

export function DietaryFilters({
  dietaryFilter,
  excludedAllergens,
  onDietaryFilterChange,
  onAllergensChange,
}: DietaryFiltersProps) {
  const toggleAllergen = (allergen: string) => {
    if (excludedAllergens.includes(allergen)) {
      onAllergensChange(excludedAllergens.filter((a) => a !== allergen));
    } else {
      onAllergensChange([...excludedAllergens, allergen]);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Dietary Preferences</h3>
      
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Diet Type</label>
        <div className="flex gap-2">
          {(["all", "vegetarian", "vegan"] as const).map((option) => (
            <button
              key={option}
              onClick={() => onDietaryFilterChange(option)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dietaryFilter === option
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Exclude Allergens
        </label>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              onClick={() => toggleAllergen(allergen)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                excludedAllergens.includes(allergen)
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {allergen}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
