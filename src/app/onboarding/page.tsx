"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPreferences,
  LOCATIONS,
  ALLERGENS,
  PROTEINS,
  MenuItem,
} from "@/types/menu";

const DEFAULT_PREFERENCES: UserPreferences = {
  targetCalories: 2500,
  targetProtein: 150,
  targetCarbs: 300,
  targetFat: 80,
  breakfastLocation: "chestnut",
  lunchLocation: "newcollege",
  dinnerLocation: "chestnut",
  dietaryFilter: "all",
  excludedAllergens: [],
  excludedProteins: [],
  isHalal: false,
  likedItemIds: [],
  dislikedItemIds: [],
  onboardingCompleted: false,
};

function DecorativeCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const rotations = {
    "top-left": "",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  };

  return (
    <svg
      className={`absolute w-8 h-8 ${rotations[position]} ${
        position.includes("top") ? "-top-[1px]" : "-bottom-[1px]"
      } ${position.includes("left") ? "-left-[1px]" : "-right-[1px]"}`}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#1E3765"
      strokeWidth="1"
      strokeLinecap="round"
    >
      <path d="M0 32 L0 0 L32 0" />
      <path d="M0 12 Q6 6 12 0" />
    </svg>
  );
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loadingMenu, setLoadingMenu] = useState(false);



  useEffect(() => {
    if (step === 5) {
      fetchMenuItems();
    }
  }, [step]);

  const fetchMenuItems = async () => {
    setLoadingMenu(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      
      const response = await fetch(`/api/menu?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        const allItems: MenuItem[] = [];
        
        for (const location of Object.values(data.locations)) {
          const loc = location as { meals: { [key: string]: MenuItem[] } };
          for (const items of Object.values(loc.meals)) {
            allItems.push(...items);
          }
        }
        
        // Get high protein items, diverse categories
        const highProtein = allItems
          .filter(item => item.protein > 10 && item.calories > 0)
          .sort((a, b) => b.protein - a.protein);
        
        // Get unique items by name, mix of categories
        const seen = new Set<string>();
        const diverse: MenuItem[] = [];
        for (const item of highProtein) {
          const key = item.name.toLowerCase();
          if (!seen.has(key) && diverse.length < 8) {
            seen.add(key);
            diverse.push(item);
          }
        }
        
        setMenuItems(diverse);
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleNext = () => {
    if (step === 5) {
      setPreferences(prev => ({
        ...prev,
        likedItemIds: Array.from(selectedItems),
      }));
    }
    if (step < 6) {
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
      likedItemIds: Array.from(selectedItems),
      onboardingCompleted: true,
    };
    localStorage.setItem("mealPlannerPreferences", JSON.stringify(finalPreferences));
    router.push("/");
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllergen = (allergen: string) => {
    setPreferences(prev => ({
      ...prev,
      excludedAllergens: prev.excludedAllergens.includes(allergen)
        ? prev.excludedAllergens.filter(a => a !== allergen)
        : [...prev.excludedAllergens, allergen],
    }));
  };

  const toggleProtein = (protein: string) => {
    setPreferences(prev => ({
      ...prev,
      excludedProteins: prev.excludedProteins.includes(protein)
        ? prev.excludedProteins.filter(p => p !== protein)
        : [...prev.excludedProteins, protein],
    }));
  };

  return (
    <main className="min-h-screen w-screen p-4 md:p-6">
      <div className="relative min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] w-full border border-[#1E3765] overflow-hidden">
        <DecorativeCorner position="top-left" />
        <DecorativeCorner position="top-right" />
        <DecorativeCorner position="bottom-left" />
        <DecorativeCorner position="bottom-right" />
        
        <div className="h-full overflow-y-auto px-6 py-8 max-w-lg mx-auto">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h1
                className="text-[28px] md:text-[36px] mb-4 leading-tight"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                Let us handle your meal planning.
              </h1>
              <p
                className="text-[17px] text-[#0D0D0D] opacity-60 mb-12 max-w-sm"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                We&apos;ll make sure you always hit your protein.
              </p>
              <button
                onClick={handleNext}
                className="px-8 py-3 border border-[#1E3765] text-[#1E3765] text-[15px] hover:bg-[#1E3765] hover:text-white transition-colors duration-200"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                Get started
              </button>
            </div>
          )}

          {/* Step 2: Macro Targets */}
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

          {/* Step 3: Dining Locations */}
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

          {/* Step 4: Hard No's */}
          {step === 4 && (
            <div className="py-4">
              <h2
                className="text-[28px] md:text-[32px] mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                Anything you won&apos;t eat?
              </h2>
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                We&apos;ll keep these out of your meal plans
              </p>

              <div className="space-y-8">
                <div>
                  <label className="block text-[14px] opacity-60 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                    Diet type
                  </label>
                  <div className="flex gap-2">
                    {(["all", "vegetarian", "vegan"] as const).map(diet => (
                      <button
                        key={diet}
                        onClick={() => setPreferences(prev => ({ ...prev, dietaryFilter: diet }))}
                        className={`flex-1 px-4 py-3 border text-[14px] capitalize transition-colors ${
                          preferences.dietaryFilter === diet
                            ? "border-[#1E3765] bg-[#1E3765] text-white"
                            : "border-[#E5E5E5] hover:border-[#1E3765]"
                        }`}
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {diet === "all" ? "No Restriction" : diet}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] opacity-60 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                    Proteins to avoid
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROTEINS.map(protein => (
                      <button
                        key={protein}
                        onClick={() => toggleProtein(protein)}
                        className={`px-4 py-2 border text-[14px] capitalize transition-colors ${
                          preferences.excludedProteins.includes(protein)
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-[#E5E5E5] hover:border-[#1E3765]"
                        }`}
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {protein}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] opacity-60 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                    Allergens
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map(allergen => (
                      <button
                        key={allergen}
                        onClick={() => toggleAllergen(allergen)}
                        className={`px-4 py-2 border text-[14px] capitalize transition-colors ${
                          preferences.excludedAllergens.includes(allergen)
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-[#E5E5E5] hover:border-[#1E3765]"
                        }`}
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, isHalal: !prev.isHalal }))}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      preferences.isHalal ? "bg-[#1E3765]" : "bg-[#E5E5E5]"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.isHalal ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-[15px]" style={{ fontFamily: "var(--font-lato)" }}>
                    Halal only
                  </span>
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
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 border border-[#1E3765] bg-[#1E3765] text-white text-[15px] hover:bg-[#152a4d] transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: What Sounds Good */}
          {step === 5 && (
            <div className="py-4">
              <h2
                className="text-[28px] md:text-[32px] mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                What would you actually eat?
              </h2>
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                Tap the items that sound good to you
              </p>

              {loadingMenu ? (
                <div className="text-center py-12 opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
                  Loading menu items...
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-12 opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
                  <p>Couldn&apos;t load menu items.</p>
                  <p className="text-[14px] mt-2">You can skip this step and we&apos;ll learn your preferences over time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full p-4 border text-left transition-colors ${
                        selectedItems.has(item.id)
                          ? "border-[#1E3765] bg-[#1E3765]/5"
                          : "border-[#E5E5E5] hover:border-[#1E3765]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[16px]" style={{ fontFamily: "var(--font-lato)", fontWeight: 500 }}>
                            {item.name}
                          </p>
                          <p className="text-[13px] opacity-50 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                            {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] opacity-70" style={{ fontFamily: "var(--font-lato)" }}>
                            {item.protein}g protein
                          </p>
                          <p className="text-[13px] opacity-50" style={{ fontFamily: "var(--font-lato)" }}>
                            {item.calories} cal
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[13px] opacity-40 mt-6 text-center" style={{ fontFamily: "var(--font-lato)" }}>
                This helps us suggest meals you&apos;ll actually want
              </p>

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
                  {selectedItems.size > 0 ? "Continue" : "Skip for now"}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Your First Plan */}
          {step === 6 && (
            <div className="py-4">
              <h2
                className="text-[28px] md:text-[32px] mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                You&apos;re all set
              </h2>
              <p
                className="text-[15px] text-[#0D0D0D] opacity-60 mb-8"
                style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}
              >
                Here&apos;s what we&apos;ve set up for you
              </p>

              <div className="space-y-6">
                <div className="p-4 border border-[#E5E5E5]">
                  <p className="text-[13px] opacity-50 mb-1" style={{ fontFamily: "var(--font-lato)" }}>Daily Targets</p>
                  <p className="text-[18px]" style={{ fontFamily: "var(--font-lato)", fontWeight: 500 }}>
                    {preferences.targetCalories} cal · {preferences.targetProtein}g protein
                  </p>
                  <p className="text-[14px] opacity-60" style={{ fontFamily: "var(--font-lato)" }}>
                    {preferences.targetCarbs}g carbs · {preferences.targetFat}g fat
                  </p>
                </div>

                <div className="p-4 border border-[#E5E5E5]">
                  <p className="text-[13px] opacity-50 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Dining Locations</p>
                  <div className="space-y-1 text-[15px]" style={{ fontFamily: "var(--font-lato)" }}>
                    <p><span className="opacity-50">Breakfast:</span> {LOCATIONS[preferences.breakfastLocation as keyof typeof LOCATIONS]?.name}</p>
                    <p><span className="opacity-50">Lunch:</span> {LOCATIONS[preferences.lunchLocation as keyof typeof LOCATIONS]?.name}</p>
                    <p><span className="opacity-50">Dinner:</span> {LOCATIONS[preferences.dinnerLocation as keyof typeof LOCATIONS]?.name}</p>
                  </div>
                </div>

                {(preferences.excludedProteins.length > 0 || preferences.excludedAllergens.length > 0 || preferences.dietaryFilter !== "all") && (
                  <div className="p-4 border border-[#E5E5E5]">
                    <p className="text-[13px] opacity-50 mb-2" style={{ fontFamily: "var(--font-lato)" }}>Dietary Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.dietaryFilter !== "all" && (
                        <span className="px-3 py-1 bg-[#1E3765]/10 text-[13px] capitalize" style={{ fontFamily: "var(--font-lato)" }}>
                          {preferences.dietaryFilter}
                        </span>
                      )}
                      {preferences.isHalal && (
                        <span className="px-3 py-1 bg-[#1E3765]/10 text-[13px]" style={{ fontFamily: "var(--font-lato)" }}>
                          Halal
                        </span>
                      )}
                      {preferences.excludedProteins.map(p => (
                        <span key={p} className="px-3 py-1 bg-red-50 text-red-700 text-[13px] capitalize" style={{ fontFamily: "var(--font-lato)" }}>
                          No {p}
                        </span>
                      ))}
                      {preferences.excludedAllergens.map(a => (
                        <span key={a} className="px-3 py-1 bg-red-50 text-red-700 text-[13px] capitalize" style={{ fontFamily: "var(--font-lato)" }}>
                          No {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[14px] opacity-50 mt-8 text-center" style={{ fontFamily: "var(--font-lato)" }}>
                Tap any item to swap it for something else
              </p>

              <div className="flex gap-4 mt-6">
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
                  Let&apos;s go
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
