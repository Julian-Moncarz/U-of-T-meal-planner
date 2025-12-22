import { describe, it, expect } from "vitest";
import { parseNumber, normalizeMeal } from "@/lib/scraper";

describe("scraper utilities", () => {
  describe("parseNumber", () => {
    it("parses simple integers", () => {
      expect(parseNumber("100")).toBe(100);
      expect(parseNumber("0")).toBe(0);
      expect(parseNumber("999")).toBe(999);
    });

    it("parses decimals", () => {
      expect(parseNumber("10.5")).toBe(10.5);
      expect(parseNumber("0.25")).toBe(0.25);
    });

    it("handles comma-separated numbers", () => {
      expect(parseNumber("1,000")).toBe(1000);
      expect(parseNumber("1,234,567")).toBe(1234567);
    });

    it("handles whitespace", () => {
      expect(parseNumber("  100  ")).toBe(100);
      expect(parseNumber("\t50\n")).toBe(50);
    });

    it("returns 0 for invalid input", () => {
      expect(parseNumber("")).toBe(0);
      expect(parseNumber("abc")).toBe(0);
      expect(parseNumber("N/A")).toBe(0);
    });
  });

  describe("normalizeMeal", () => {
    it("normalizes breakfast variations", () => {
      expect(normalizeMeal("Breakfast")).toBe("breakfast");
      expect(normalizeMeal("BREAKFAST")).toBe("breakfast");
      expect(normalizeMeal("Daily Breakfast")).toBe("breakfast");
    });

    it("normalizes lunch variations", () => {
      expect(normalizeMeal("Lunch")).toBe("lunch");
      expect(normalizeMeal("LUNCH")).toBe("lunch");
      expect(normalizeMeal("Daily Lunch Special")).toBe("lunch");
    });

    it("normalizes dinner variations", () => {
      expect(normalizeMeal("Dinner")).toBe("dinner");
      expect(normalizeMeal("DINNER")).toBe("dinner");
      expect(normalizeMeal("Evening Dinner")).toBe("dinner");
    });

    it("defaults to lunch for unknown meals", () => {
      expect(normalizeMeal("Brunch")).toBe("lunch");
      expect(normalizeMeal("Snack")).toBe("lunch");
      expect(normalizeMeal("")).toBe("lunch");
    });
  });

});
