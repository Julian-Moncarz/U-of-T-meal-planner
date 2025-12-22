"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DecorativeCorner } from "@/components/DecorativeCorner";
import { UserPreferences } from "@/types/menu";
import { getStoredPreferencesWithDefaults } from "@/lib/storage";

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences>(() => getStoredPreferencesWithDefaults());
  const [mounted, setMounted] = useState(false);

  if (!mounted) {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }

  const handleSave = () => {
    localStorage.setItem("mealPlannerPreferences", JSON.stringify(preferences));
    // Clear any cached suggestions so they regenerate with new preferences
    router.push("/");
    router.refresh();
  };

  if (!mounted) {
    return (
      <main className="h-screen w-screen flex items-center justify-center">
        <p className="text-[#0D0D0D] opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen p-4 md:p-6">
      <div className="relative min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] w-full border border-[#1A1A1A] overflow-hidden">
        <DecorativeCorner position="top-left" />
        <DecorativeCorner position="top-right" />
        <DecorativeCorner position="bottom-left" />
        <DecorativeCorner position="bottom-right" />

        <div className="h-full overflow-y-auto px-6 py-8 max-w-lg mx-auto">
          <h1
            className="text-[28px] md:text-[32px] mb-2"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            Preferences
          </h1>
          <p
            className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
            style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
          >
            Update your meal planning preferences
          </p>

          {/* Location Settings */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Dining Locations
            </h2>
            <div className="space-y-4">
              {(["breakfast", "lunch", "dinner"] as const).map(meal => (
                <div key={meal}>
                  <label className="block text-[14px] opacity-60 mb-2 capitalize" style={{ fontFamily: "var(--font-lato)" }}>
                    {meal}
                  </label>
                  <select
                    value={preferences[`${meal}Location`]}
                    onChange={e => setPreferences(prev => ({ ...prev, [`${meal}Location`]: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    <option value="campusone">CampusOne Dining Hall</option>
                    <option value="chestnut">Chestnut Residence</option>
                    <option value="newcollege">New College Dining Hall</option>
                    <option value="oakhouse">Oak House Dining Hall</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Targets */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Daily Targets
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] opacity-60 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Calories</label>
                <input
                  type="number"
                  value={preferences.targetCalories}
                  onChange={e => setPreferences(prev => ({ ...prev, targetCalories: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
              <div>
                <label className="block text-[14px] opacity-60 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Protein (g)</label>
                <input
                  type="number"
                  value={preferences.targetProtein}
                  onChange={e => setPreferences(prev => ({ ...prev, targetProtein: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="mb-8">
            <h2 className="text-[16px] font-medium mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Dietary Preferences
            </h2>
            <textarea
              value={preferences.dietaryPreferences}
              onChange={e => setPreferences(prev => ({ ...prev, dietaryPreferences: e.target.value }))}
              placeholder="e.g., vegetarian, no shellfish, halal, I don't like spicy food..."
              rows={4}
              className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1A1A1A] focus:outline-none resize-none"
              style={{ fontFamily: "var(--font-lato)" }}
            />
            <p className="text-[13px] opacity-40 mt-2" style={{ fontFamily: "var(--font-lato)" }}>
              Describe any dietary restrictions, preferences, or foods you want to avoid
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-10">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 border border-[#E5E5E5] text-[#0D0D0D] text-[15px] hover:border-[#1A1A1A] transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-[15px] hover:bg-[#333] transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Save & Regenerate
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
