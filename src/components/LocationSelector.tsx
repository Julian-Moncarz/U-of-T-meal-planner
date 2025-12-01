"use client";

import { LOCATIONS } from "@/types/menu";

interface LocationSelectorProps {
  meal: string;
  value: string;
  onChange: (value: string) => void;
}

export function LocationSelector({ meal, value, onChange }: LocationSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 capitalize">{meal}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {Object.values(LOCATIONS).map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface LocationSelectorGroupProps {
  breakfastLocation: string;
  lunchLocation: string;
  dinnerLocation: string;
  onBreakfastChange: (value: string) => void;
  onLunchChange: (value: string) => void;
  onDinnerChange: (value: string) => void;
}

export function LocationSelectorGroup({
  breakfastLocation,
  lunchLocation,
  dinnerLocation,
  onBreakfastChange,
  onLunchChange,
  onDinnerChange,
}: LocationSelectorGroupProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Dining Locations</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LocationSelector
          meal="breakfast"
          value={breakfastLocation}
          onChange={onBreakfastChange}
        />
        <LocationSelector
          meal="lunch"
          value={lunchLocation}
          onChange={onLunchChange}
        />
        <LocationSelector
          meal="dinner"
          value={dinnerLocation}
          onChange={onDinnerChange}
        />
      </div>
    </div>
  );
}
