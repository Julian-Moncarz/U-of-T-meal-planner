import { describe, it, expect } from "vitest";
import { formatServingSize } from "@/lib/mealTypes";
import { MenuItem } from "@/types/menu";

const createMockItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: "test-item",
  name: "Test Item",
  category: "Test Category",
  location: "Test Location",
  meal: "lunch",
  date: "2024-01-01",
  servingSize: "100g",
  calories: 200,
  protein: 20,
  carbs: 25,
  fat: 8,
  fiber: 3,
  sugar: 5,
  sodium: 400,
  allergens: [],
  ...overrides,
});

describe("llmSuggestions", () => {
  describe("formatServingSize", () => {
    it("formats 'each' items as count", () => {
      const item = createMockItem({ servingSize: "1 each" });
      expect(formatServingSize(item, 1)).toBe("1");
      expect(formatServingSize(item, 3)).toBe("3x");
    });

    it("formats 'slice' items as count", () => {
      const item = createMockItem({ servingSize: "1 slice" });
      expect(formatServingSize(item, 1)).toBe("1");
      expect(formatServingSize(item, 2)).toBe("2x");
    });

    it("formats 'piece' items as count", () => {
      const item = createMockItem({ servingSize: "1 piece" });
      expect(formatServingSize(item, 1)).toBe("1");
      expect(formatServingSize(item, 4)).toBe("4x");
    });

    it("converts grams to cups for regular items", () => {
      const item = createMockItem({ servingSize: "100g", category: "Main" });
      // 100g * 2 servings = 200g
      // 200g / 150g per cup = 1.33 cups -> ~1 cup
      const result = formatServingSize(item, 2);
      expect(result).toContain("200g");
      expect(result).toContain("cup");
    });

    it("uses different cup conversions for salads", () => {
      const item = createMockItem({ servingSize: "50g", category: "Salad Bar" });
      // 50g * 2 = 100g
      // 100g / 50g per cup (salad) = 2 cups
      const result = formatServingSize(item, 2);
      expect(result).toContain("100g");
      expect(result).toContain("2 cups");
    });

    it("uses different cup conversions for rice/grains", () => {
      const item = createMockItem({ servingSize: "90g", category: "Rice and Grains" });
      // 90g * 2 = 180g
      // 180g / 180g per cup (rice) = 1 cup
      const result = formatServingSize(item, 2);
      expect(result).toContain("180g");
      expect(result).toContain("1 cup");
    });

    it("uses different cup conversions for soup", () => {
      const item = createMockItem({ servingSize: "240g", category: "Soup Station" });
      // 240g / 240g per cup = 1 cup
      const result = formatServingSize(item, 1);
      expect(result).toContain("240g");
      expect(result).toContain("1 cup");
    });

    it("handles items without gram measurement", () => {
      const item = createMockItem({ servingSize: "1 portion" });
      expect(formatServingSize(item, 1)).toBe("1 portion");
      expect(formatServingSize(item, 2)).toBe("2x 1 portion");
    });

    it("shows quarter cup for small amounts", () => {
      const item = createMockItem({ servingSize: "30g", category: "Main" });
      // 30g / 150g per cup = 0.2 cups -> ~1/4 cup
      const result = formatServingSize(item, 1);
      expect(result).toContain("30g");
      expect(result).toContain("1/4 cup");
    });

    it("shows half cup for medium-small amounts", () => {
      const item = createMockItem({ servingSize: "75g", category: "Main" });
      // 75g / 150g per cup = 0.5 cups -> ~1/2 cup
      const result = formatServingSize(item, 1);
      expect(result).toContain("75g");
      expect(result).toContain("1/2 cup");
    });
  });
});
