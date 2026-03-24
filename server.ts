import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

// Weighted Matching Algorithm Staples (assigned lower weights)
const PANTRY_STAPLES = new Set(["salt", "water", "oil", "pepper", "sugar", "flour"]);

// Allergen Categories and Parent-Child Relationships
const ALLERGEN_MAP: Record<string, string[]> = {
  "nuts": ["peanuts", "walnuts", "almonds", "cashews", "pecans", "peanut butter"],
  "dairy": ["cheese", "butter", "sour cream", "feta", "crema", "parmesan", "milk"],
  "gluten": ["pasta", "bread", "flour", "noodles", "tortilla", "bun", "hoagie roll", "soy sauce", "bread crumbs"],
  "fish": ["salmon", "tuna", "white fish", "shrimp", "cod", "tilapia"],
  "pork": ["bacon", "pork", "pork sausage", "ham"]
};

// Map individual ingredients to their parents/categories for broader exclusion
const INGREDIENT_RELATIONS: Record<string, string[]> = {
  "peanut": ["peanut butter", "peanuts"],
  "nuts": ALLERGEN_MAP["nuts"],
  "dairy": ALLERGEN_MAP["dairy"],
  "gluten": ALLERGEN_MAP["gluten"],
  "fish": ALLERGEN_MAP["fish"],
  "pork": ALLERGEN_MAP["pork"]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Recipe Database (Flat File JSON)
  const recipesPath = path.join(process.cwd(), "src/data/recipes.json");
  let recipes = JSON.parse(fs.readFileSync(recipesPath, "utf-8"));

  // Ingredients Index for Autocomplete
  const allIngredients = Array.from(new Set(recipes.flatMap((r: any) => r.ingredients))).sort();
  const categories = Object.keys(ALLERGEN_MAP);

  // API Endpoints
  app.get("/api/ingredients", (req, res) => {
    res.json({
      ingredients: allIngredients,
      categories: categories
    });
  });

  app.post("/api/recipes/search", (req, res) => {
    const { included = [], excluded = [] } = req.body;
    
    const includedSet = new Set(included.map((i: string) => i.toLowerCase()));
    
    // Expand exclusions based on relations and categories
    const expandedExclusions = new Set<string>();
    excluded.forEach((ex: string) => {
      const lowerEx = ex.toLowerCase();
      expandedExclusions.add(lowerEx);
      
      // Add related items (e.g., "peanut" -> "peanut butter")
      if (INGREDIENT_RELATIONS[lowerEx]) {
        INGREDIENT_RELATIONS[lowerEx].forEach(rel => expandedExclusions.add(rel.toLowerCase()));
      }
      
      // Fuzzy match: if excluding "peanut", also exclude "peanut butter" if it contains the word
      // This handles cases not explicitly in the map
      allIngredients.forEach((ing: any) => {
        if (ing.toLowerCase().includes(lowerEx)) {
          expandedExclusions.add(ing.toLowerCase());
        }
      });
    });

    const results = recipes
      .filter((recipe: any) => {
        // Exclusion Filter (checks both ingredients and tags)
        const recipeIngs = recipe.ingredients.map((i: string) => i.toLowerCase());
        const recipeTags = recipe.tags.map((t: string) => t.toLowerCase());
        
        const hasExcludedIng = recipeIngs.some((ing: string) => expandedExclusions.has(ing));
        const hasExcludedTag = recipeTags.some((tag: string) => expandedExclusions.has(tag));
        
        return !hasExcludedIng && !hasExcludedTag;
      })
      .map((recipe: any) => {
        const recipeIngs = recipe.ingredients.map((i: string) => i.toLowerCase());
        const matched = recipeIngs.filter((ing: string) => includedSet.has(ing));
        const missing = recipeIngs.filter((ing: string) => !includedSet.has(ing));

        // Weighted Matching Algorithm
        // Score = (Matches / Total) - (Missing distinctive ingredients weight)
        // Pantry staples are weighted less in the "missing" penalty
        const matchCount = matched.length;
        const totalCount = recipeIngs.length;
        
        let score = (matchCount / totalCount) * 100;
        
        // Bonus for matching distinctive ingredients
        matched.forEach(ing => {
          if (!PANTRY_STAPLES.has(ing)) score += 5;
        });

        return {
          ...recipe,
          matchCount,
          totalCount,
          matched,
          missing,
          score
        };
      })
      .filter((recipe: any) => {
        // If included ingredients are specified, only show recipes that match at least one
        if (included.length > 0) {
          return recipe.matchCount > 0;
        }
        return true;
      })
      .sort((a: any, b: any) => b.score - a.score);

    res.json(results);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
