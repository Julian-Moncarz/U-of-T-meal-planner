import MealAccordion from "@/components/MealAccordion";

const mockMeals = {
  breakfast: [
    "Oatmeal with fresh berries",
    "Greek yogurt parfait",
    "Fresh-squeezed orange juice",
  ],
  lunch: [
    "Grilled chicken Caesar salad",
    "Artisan whole grain bread",
    "Sliced Honeycrisp apple",
  ],
  dinner: [
    "Pan-seared Atlantic salmon",
    "Steamed seasonal vegetables",
    "Wild rice pilaf",
  ],
};

export default function MealsPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-8 md:py-16 max-w-lg mx-auto">
      <header className="mb-10">
        <h1
          className="text-[36px] md:text-[42px] tracking-wide mb-2"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
          }}
        >
          Your Meals
        </h1>
        <p
          className="text-sm opacity-60"
          style={{
            fontFamily: "var(--font-lato), Arial, sans-serif",
            fontWeight: 300,
            letterSpacing: "0.02em",
          }}
        >
          Today&apos;s planned nutrition
        </p>
      </header>

      <MealAccordion meals={mockMeals} />
    </main>
  );
}
