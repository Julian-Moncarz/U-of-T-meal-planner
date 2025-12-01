"use client";

interface MacroInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
}

export function MacroInput({ label, value, onChange, unit = "g", min = 0, max = 1000 }: MacroInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={min}
          max={max}
        />
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

interface MacroInputGroupProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onCaloriesChange: (value: number) => void;
  onProteinChange: (value: number) => void;
  onCarbsChange: (value: number) => void;
  onFatChange: (value: number) => void;
}

export function MacroInputGroup({
  calories,
  protein,
  carbs,
  fat,
  onCaloriesChange,
  onProteinChange,
  onCarbsChange,
  onFatChange,
}: MacroInputGroupProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Daily Macro Targets</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MacroInput
          label="Calories"
          value={calories}
          onChange={onCaloriesChange}
          unit="kcal"
          max={5000}
        />
        <MacroInput
          label="Protein"
          value={protein}
          onChange={onProteinChange}
          max={500}
        />
        <MacroInput
          label="Carbs"
          value={carbs}
          onChange={onCarbsChange}
          max={800}
        />
        <MacroInput
          label="Fat"
          value={fat}
          onChange={onFatChange}
          max={300}
        />
      </div>
    </div>
  );
}
