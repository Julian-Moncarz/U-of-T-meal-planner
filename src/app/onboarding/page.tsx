"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DecorativeCorner } from "@/components/DecorativeCorner";
import { UserPreferences, LOCATIONS } from "@/types/menu";
import { DEFAULT_PREFERENCES } from "@/lib/constants";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = () => {
    const finalPreferences: UserPreferences = {
      ...preferences,
      onboardingCompleted: true,
    };
    localStorage.setItem("mealPlannerPreferences", JSON.stringify(finalPreferences));
    router.push("/");
  };

  return (
    <main className="min-h-screen w-screen p-4 md:p-6">
      <div className="relative min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] w-full border border-[#1E3765] overflow-hidden">
        <DecorativeCorner position="top-left" variant="onboarding" />
        <DecorativeCorner position="top-right" variant="onboarding" />
        <DecorativeCorner position="bottom-left" variant="onboarding" />
        <DecorativeCorner position="bottom-right" variant="onboarding" />

        <div className="h-full overflow-y-auto px-6 py-8 max-w-lg mx-auto">
          {/* Step 1: Macro Targets */}
          {step === 1 && (
            <div className="py-4">
              <h2
                className="text-[28px] md:text-[32px] mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                What are your daily targets?
              </h2>
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                We&apos;ll build your meals around these
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] opacity-60 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Calories</label>
                    <input
                      type="number"
                      value={preferences.targetCalories}
                      onChange={e => setPreferences(prev => ({ ...prev, targetCalories: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1E3765] focus:outline-none"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] opacity-60 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Protein (g)</label>
                    <input
                      type="number"
                      value={preferences.targetProtein}
                      onChange={e => setPreferences(prev => ({ ...prev, targetProtein: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1E3765] focus:outline-none"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 border border-[#1E3765] bg-[#1E3765] text-white text-[15px] hover:bg-[#152a4d] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Dining Locations */}
          {step === 2 && (
            <div className="py-4">
              <h2
                className="text-[28px] md:text-[32px] mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                Where do you usually eat?
              </h2>
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                We&apos;ll pull menus from these spots
              </p>

              <div className="space-y-6">
                {(["breakfast", "lunch", "dinner"] as const).map(meal => (
                  <div key={meal}>
                    <label className="block text-[14px] opacity-60 mb-2 capitalize" style={{ fontFamily: "var(--font-lato)" }}>
                      {meal} at...
                    </label>
                    <select
                      value={preferences[`${meal}Location`]}
                      onChange={e => setPreferences(prev => ({ ...prev, [`${meal}Location`]: e.target.value }))}
                      className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1E3765] focus:outline-none appearance-none cursor-pointer"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      {Object.values(LOCATIONS).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-[#E5E5E5] text-[#0D0D0D] text-[15px] hover:border-[#1E3765] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 border border-[#1E3765] bg-[#1E3765] text-white text-[15px] hover:bg-[#152a4d] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Dietary Preferences */}
          {step === 3 && (
            <div className="py-4">
              <h2
                className="text-[28px] md:text-[32px] mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                Any dietary preferences?
              </h2>
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                Tell us what you like or need to avoid
              </p>

              <div className="space-y-6">
                <div>
                  <textarea
                    value={preferences.dietaryPreferences}
                    onChange={e => setPreferences(prev => ({ ...prev, dietaryPreferences: e.target.value }))}
                    placeholder="e.g., vegetarian, no shellfish, halal, I don't like spicy food, prefer high-protein options..."
                    rows={4}
                    className="w-full px-4 py-3 border border-[#E5E5E5] bg-transparent text-[16px] focus:border-[#1E3765] focus:outline-none resize-none"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                  <p className="text-[13px] opacity-40 mt-2" style={{ fontFamily: "var(--font-lato)" }}>
                    You can update this anytime from the main page
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-[#E5E5E5] text-[#0D0D0D] text-[15px] hover:border-[#1E3765] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 px-6 py-3 border border-[#1E3765] bg-[#1E3765] text-white text-[15px] hover:bg-[#152a4d] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  {preferences.dietaryPreferences.trim() ? "Let's go" : "Skip for now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
