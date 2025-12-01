import * as cheerio from "cheerio";
import { MenuItem, DailyMenu } from "@/types/menu";

const BASE_URL = "https://fso.ueat.utoronto.ca/FSO/ServiceMenuReport";

interface MenuReportInfo {
  id: string;
  location: string;
  locationId: string;
  meal: string;
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function generateItemId(name: string, location: string, meal: string, date: string): string {
  return `${date}-${location}-${meal}-${name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeMeal(meal: string): "breakfast" | "lunch" | "dinner" {
  const lower = meal.toLowerCase();
  if (lower.includes("breakfast")) return "breakfast";
  if (lower.includes("lunch")) return "lunch";
  if (lower.includes("dinner")) return "dinner";
  return "lunch"; // default
}

async function fetchMainPage(date?: string): Promise<string> {
  const url = date 
    ? `${BASE_URL}/GetDate?dt=${date.replace(/-/g, "")}`
    : `${BASE_URL}/Today`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; UofT Meal Planner)",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch menu: ${response.status}`);
  }
  
  return response.text();
}

function extractMenuReports(html: string): MenuReportInfo[] {
  const reports: MenuReportInfo[] = [];
  
  // The navigation structure is embedded in JavaScript as nested 'items' arrays
  // Structure: Location groups -> Meal items -> GUIDs
  // Based on the actual structure observed:
  // - CampusOne: 3 meals (breakfast, lunch, dinner)
  // - Chestnut: 3 meals  
  // - MSB: 8 stations (skip - not a dining hall)
  // - New College: 3 meals
  // - Oak House: 3 meals
  // - Robarts: 3 stations (skip)
  // - Sidney Smith: 4 stations (skip)
  
  // Extract the nested items structure using regex
  const itemsMatch = html.match(/'items':\[\{'name':'noaction','items':\[([\s\S]*?)\]\}\]/);
  
  if (!itemsMatch) {
    // Fallback: just extract all GUIDs and map them to known structure
    const guidPattern = /name':'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'/g;
    const guids: string[] = [];
    let match;
    while ((match = guidPattern.exec(html)) !== null) {
      guids.push(match[1]);
    }
    
    // Map based on known structure from UofT site
    // CampusOne: indices 0-2, Chestnut: 3-5, skip MSB (6-13), New College: 14-16, Oak House: 17-19
    const locationMappings = [
      { location: "CampusOne Dining Hall", locationId: "campusone", startIdx: 0, meals: ["breakfast", "lunch", "dinner"] },
      { location: "Chestnut Residence", locationId: "chestnut", startIdx: 3, meals: ["breakfast", "lunch", "dinner"] },
      { location: "New College Dining Hall", locationId: "newcollege", startIdx: 14, meals: ["breakfast", "lunch", "dinner"] },
      { location: "Oak House Dining Hall", locationId: "oakhouse", startIdx: 17, meals: ["breakfast", "lunch", "dinner"] },
    ];
    
    for (const mapping of locationMappings) {
      for (let i = 0; i < mapping.meals.length; i++) {
        const idx = mapping.startIdx + i;
        if (idx < guids.length) {
          reports.push({
            id: guids[idx],
            location: mapping.location,
            locationId: mapping.locationId,
            meal: mapping.meals[i],
          });
        }
      }
    }
    
    return reports;
  }
  
  // Parse the complex nested structure
  const nestedPattern = /\{'name':'noaction','items':\[((?:\{'name':'[^']+'\},?)+)\]\}/g;
  const locationGroups: string[][] = [];
  let groupMatch;
  
  while ((groupMatch = nestedPattern.exec(html)) !== null) {
    const groupContent = groupMatch[1];
    const guidPattern = /\{'name':'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'\}/g;
    const groupGuids: string[] = [];
    let guidMatch;
    while ((guidMatch = guidPattern.exec(groupContent)) !== null) {
      groupGuids.push(guidMatch[1]);
    }
    if (groupGuids.length > 0) {
      locationGroups.push(groupGuids);
    }
  }
  
  // Map the groups to locations (based on observed structure)
  const locationNames = [
    { name: "CampusOne Dining Hall", id: "campusone" },
    { name: "Chestnut Residence", id: "chestnut" },
    { name: "Medical Science Building (MSB) Cafeteria", id: "msb" },
    { name: "New College Dining Hall", id: "newcollege" },
    { name: "Oak House Dining Hall", id: "oakhouse" },
    { name: "Robarts Cafeteria", id: "robarts" },
    { name: "Sidney Smith Cafeteria", id: "sidneysmith" },
  ];
  
  for (let i = 0; i < Math.min(locationGroups.length, locationNames.length); i++) {
    const group = locationGroups[i];
    const loc = locationNames[i];
    
    // For dining halls with 3 items, assume breakfast/lunch/dinner
    // For cafeterias with more, skip or handle differently
    if (group.length === 3) {
      const meals = ["breakfast", "lunch", "dinner"];
      for (let j = 0; j < 3; j++) {
        reports.push({
          id: group[j],
          location: loc.name,
          locationId: loc.id,
          meal: meals[j],
        });
      }
    }
  }
  
  return reports;
}

async function fetchMenuReport(reportId: string): Promise<string> {
  const url = `${BASE_URL}/GetReport/${reportId}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; UofT Meal Planner)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "",
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch report ${reportId}: ${response.status}`);
  }
  
  return response.text();
}

function parseMenuReport(html: string, location: string, meal: string, date: string): MenuItem[] {
  const $ = cheerio.load(html);
  const items: MenuItem[] = [];
  let currentCategory = "";
  
  $("tr").each((_, row) => {
    const cells = $(row).find("td");
    
    // Category header row
    if (cells.length === 1 && $(cells[0]).hasClass("courseHeader")) {
      currentCategory = $(cells[0]).text().trim();
      return;
    }
    
    // Data row with nutritional info
    const descCell = $(row).find("td.description");
    if (descCell.length > 0) {
      const name = descCell.text().trim();
      if (!name) return;
      
      const tds = $(row).find("td");
      const lowerName = name.toLowerCase();
      const isMeat = containsMeat(lowerName);
      
      const item: MenuItem = {
        id: generateItemId(name, location, meal, date),
        name,
        category: currentCategory,
        location,
        meal: normalizeMeal(meal),
        date,
        servingSize: $(tds[1]).text().trim(),
        calories: parseNumber($(tds[2]).text()),
        fat: parseNumber($(tds[3]).text()),
        protein: parseNumber($(tds[10]).text()),
        carbs: parseNumber($(tds[7]).text()),
        fiber: parseNumber($(tds[8]).text()),
        sugar: parseNumber($(tds[9]).text()),
        sodium: parseNumber($(tds[6]).text()),
        isVegetarian: !isMeat,
        isVegan: !isMeat && (lowerName.includes("vegan") || lowerName.includes("plant based")),
        isHalal: lowerName.includes("halal"),
        allergens: [],
      };
      
      items.push(item);
    }
  });
  
  return items;
}

function containsMeat(name: string): boolean {
  const meatKeywords = [
    "chicken", "beef", "pork", "bacon", "ham", "turkey", "sausage",
    "meat", "steak", "lamb", "fish", "salmon", "tuna", "shrimp",
    "prawn", "crab", "lobster", "duck", "veal", "pepperoni", "meatball",
    "chorizo", "prosciutto", "salami", "bologna", "hotdog", "burger patty",
    "surimi", "anchovy", "anchovies", "sardine", "cod", "tilapia", "halibut",
    "trout", "mackerel", "oyster", "clam", "mussel", "scallop", "calamari",
    "squid", "octopus", "eel", "brisket", "ribs", "wings"
  ];
  
  // Check for meat keywords first
  const hasMeat = meatKeywords.some(meat => name.includes(meat));
  
  // Only return false (not meat) if item is explicitly plant-based AND doesn't contain meat
  // This prevents "Chicken And Vegetable Dumplings" from being marked vegetarian
  if (hasMeat) {
    // Check if it's a plant-based meat alternative
    const plantBasedIndicators = ["plant based", "plant-based", "impossible", "beyond", "vegan"];
    const isPlantBased = plantBasedIndicators.some(indicator => name.includes(indicator));
    return !isPlantBased;
  }
  
  return false;
}

export async function scrapeAllMenusForDate(date: string): Promise<DailyMenu> {
  const dailyMenu: DailyMenu = {
    date,
    locations: {},
  };

  try {
    // First fetch the main page to get all report GUIDs
    const mainPageHtml = await fetchMainPage(date);
    const reports = extractMenuReports(mainPageHtml);
    
    // Fetch each report and organize by location/meal
    for (const report of reports) {
      try {
        const reportHtml = await fetchMenuReport(report.id);
        const items = parseMenuReport(reportHtml, report.location, report.meal, date);
        
        if (!dailyMenu.locations[report.locationId]) {
          dailyMenu.locations[report.locationId] = {
            name: report.location,
            meals: {},
          };
        }
        
        dailyMenu.locations[report.locationId].meals[report.meal] = items;
      } catch (error) {
        console.error(`Failed to fetch report ${report.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to scrape menus for ${date}:`, error);
  }

  return dailyMenu;
}

export async function scrapeMenuForToday(): Promise<DailyMenu> {
  const today = new Date().toISOString().split("T")[0];
  return scrapeAllMenusForDate(today);
}

export async function scrapeMenusForWeek(): Promise<DailyMenu[]> {
  const menus: DailyMenu[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    
    try {
      const menu = await scrapeAllMenusForDate(dateStr);
      menus.push(menu);
    } catch (error) {
      console.error(`Failed to scrape menu for ${dateStr}:`, error);
    }
  }
  
  return menus;
}
