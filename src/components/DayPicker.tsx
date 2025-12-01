"use client";

interface DayPickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

function getNextSevenDays(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const dateStr = date.toISOString().split("T")[0];
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayName;
    
    days.push({ date: dateStr, label });
  }
  
  return days;
}

export function DayPicker({ selectedDate, onDateChange }: DayPickerProps) {
  const days = getNextSevenDays();
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Select Day</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map(({ date, label }) => (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={`flex flex-col items-center px-4 py-2 rounded-lg min-w-[80px] transition-colors ${
              selectedDate === date
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs opacity-75">
              {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
