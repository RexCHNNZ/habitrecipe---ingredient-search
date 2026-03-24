import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Check, Bookmark, ChevronLeft, ChefHat, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe } from './types';

export default function App() {
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  const [incSearch, setIncSearch] = useState('');
  const [excSearch, setExcSearch] = useState('');
  const [showIncSuggestions, setShowIncSuggestions] = useState(false);
  const [showExcSuggestions, setShowExcSuggestions] = useState(false);

  useEffect(() => {
    fetch('/api/ingredients')
      .then(res => res.json())
      .then(data => {
        setAllIngredients(data.ingredients);
        setCategories(data.categories);
      });
      
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  useEffect(() => {
    fetch('/api/recipes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ included, excluded })
    })
      .then(res => res.json())
      .then(setRecipes);
  }, [included, excluded]);

  const toggleFavorite = (id: number) => {
    const newFavs = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('favorites', JSON.stringify(newFavs));
  };

  const addIngredient = (ing: string, type: 'inc' | 'exc') => {
    if (type === 'inc') {
      if (!included.includes(ing)) setIncluded([...included, ing]);
      setIncSearch('');
      setShowIncSuggestions(false);
    } else {
      if (!excluded.includes(ing)) setExcluded([...excluded, ing]);
      setExcSearch('');
      setShowExcSuggestions(false);
    }
  };

  const removeIngredient = (ing: string, type: 'inc' | 'exc') => {
    if (type === 'inc') setIncluded(included.filter(i => i !== ing));
    else setExcluded(excluded.filter(i => i !== ing));
  };

  const filteredInc = allIngredients.filter(i => 
    i.toLowerCase().includes(incSearch.toLowerCase()) && !included.includes(i) && !excluded.includes(i)
  );

  const filteredExc = allIngredients.filter(i => 
    i.toLowerCase().includes(excSearch.toLowerCase()) && !excluded.includes(i) && !included.includes(i)
  );

  if (selectedRecipe) {
    return (
      <div className="max-w-5xl mx-auto p-6 min-h-screen">
        <button 
          onClick={() => setSelectedRecipe(null)}
          className="flex items-center text-stone-400 hover:text-brand mb-12 transition-all group"
        >
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="micro-label">Back to Search</span>
        </button>

        <div className="grid lg:grid-cols-[1fr_400px] gap-16">
          <div className="space-y-12">
            <header>
              <h1 className="editorial-title">{selectedRecipe.name}</h1>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-stone-500">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">{selectedRecipe.cookTime} mins</span>
                </div>
                <div className="flex items-center text-stone-500">
                  <ChefHat className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">{selectedRecipe.ingredients.length} Ingredients</span>
                </div>
                <button 
                  onClick={() => toggleFavorite(selectedRecipe.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all ${
                    favorites.includes(selectedRecipe.id) 
                      ? 'bg-brand/5 border-brand/20 text-brand' 
                      : 'border-stone-200 text-stone-500 hover:border-brand/40'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${favorites.includes(selectedRecipe.id) ? 'fill-brand' : ''}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">Favorite</span>
                </button>
              </div>
            </header>

            <section>
              <h2 className="text-2xl font-serif italic mb-6">Instructions</h2>
              <div className="space-y-8">
                {selectedRecipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center font-serif italic text-stone-400 group-hover:border-brand group-hover:text-brand transition-colors">
                      {idx + 1}
                    </span>
                    <p className="text-stone-600 leading-relaxed pt-2 text-lg">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-12">
            <div className="relative h-[500px] rounded-[40px] overflow-hidden shadow-2xl">
              <img 
                src={selectedRecipe.image} 
                alt={selectedRecipe.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <section className="bg-stone-50 rounded-[32px] p-8 border border-stone-200/60">
              <h2 className="text-xl font-serif italic mb-6">Ingredients</h2>
              <ul className="space-y-4">
                {selectedRecipe.ingredients.map((ing, idx) => {
                  const isMatched = included.map(i => i.toLowerCase()).includes(ing.toLowerCase());
                  return (
                    <li key={idx} className="flex items-start justify-between group">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-4 mt-1.5 ${isMatched ? 'bg-brand' : 'bg-stone-300'}`} />
                        <span className={`text-stone-700 ${isMatched ? 'font-medium' : ''}`}>{ing}</span>
                      </div>
                      {isMatched && <Check className="w-4 h-4 text-brand" />}
                    </li>
                  );
                })}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 py-24 px-6 mb-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="micro-label mb-6">Your Kitchen Assistant</p>
          <h1 className="editorial-title">Smart Cooking</h1>
          <p className="text-stone-400 max-w-lg mx-auto font-medium">
            Elevate your daily cooking with what's already in your kitchen. 
            Stop food waste, start today.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[380px_1fr] gap-20">
        {/* Sidebar Controls */}
        <aside className="space-y-12">
          {/* Include Search */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="micro-label">In your fridge</label>
              {included.length > 0 && (
                <button 
                  onClick={() => setIncluded([])}
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-brand transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text"
                  placeholder="What do you have?"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-stone-300"
                  value={incSearch}
                  onChange={(e) => {
                    setIncSearch(e.target.value);
                    setShowIncSuggestions(true);
                  }}
                  onFocus={() => setShowIncSuggestions(true)}
                />
              </div>
              
              <AnimatePresence>
                {showIncSuggestions && incSearch && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-20 w-full mt-3 bg-white border border-stone-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2"
                  >
                    {filteredInc.length > 0 ? filteredInc.map(ing => (
                      <button 
                        key={ing}
                        onClick={() => addIngredient(ing, 'inc')}
                        className="w-full text-left px-4 py-3 hover:bg-stone-50 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group"
                      >
                        {ing}
                        <Plus className="w-4 h-4 text-stone-300 group-hover:text-brand" />
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-stone-400 text-sm italic">No matches found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {included.map(ing => (
                <span key={ing} className="tag tag-included py-2 px-4">
                  {ing}
                  <button onClick={() => removeIngredient(ing, 'inc')} className="ml-3 hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </section>

          {/* Exclude Search */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="micro-label">Avoid these</label>
              {excluded.length > 0 && (
                <button 
                  onClick={() => setExcluded([])}
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text"
                  placeholder="Allergies or dislikes?"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:border-red-400 outline-none transition-all placeholder:text-stone-300"
                  value={excSearch}
                  onChange={(e) => {
                    setExcSearch(e.target.value);
                    setShowExcSuggestions(true);
                  }}
                  onFocus={() => setShowExcSuggestions(true)}
                />
              </div>
              
              <AnimatePresence>
                {showExcSuggestions && excSearch && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-20 w-full mt-3 bg-white border border-stone-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2"
                  >
                    {filteredExc.length > 0 ? filteredExc.map(ing => (
                      <button 
                        key={ing}
                        onClick={() => addIngredient(ing, 'exc')}
                        className="w-full text-left px-4 py-3 hover:bg-stone-50 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group"
                      >
                        {ing}
                        <X className="w-4 h-4 text-stone-300 group-hover:text-red-500" />
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-stone-400 text-sm italic">No matches found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {excluded.map(ing => (
                <span key={ing} className="tag tag-excluded py-2 px-4">
                  {ing}
                  <button onClick={() => removeIngredient(ing, 'exc')} className="ml-3 hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </section>

          {/* Quick Allergen Categories */}
          <section>
            <label className="micro-label mb-4 block">Common Allergens</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const isExcluded = excluded.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => isExcluded ? removeIngredient(cat, 'exc') : addIngredient(cat, 'exc')}
                    className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      isExcluded 
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
                        : 'bg-white text-stone-400 border-stone-200 hover:border-red-200 hover:text-red-500'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Favorites List */}
          {favorites.length > 0 && (
            <section>
              <label className="micro-label mb-4 block">Starred Recipes</label>
              <div className="space-y-3">
                {recipes.filter(r => favorites.includes(r.id)).map(r => (
                  <button 
                    key={r.id}
                    onClick={() => setSelectedRecipe(r)}
                    className="w-full text-left p-4 rounded-2xl hover:bg-white hover:shadow-xl border border-transparent hover:border-stone-100 transition-all group flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-stone-600 group-hover:text-brand">{r.name}</span>
                    <Bookmark className="w-3 h-3 fill-brand text-brand" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Results Area */}
        <div className="space-y-24">
          {included.length > 0 ? (
            <>
              {/* Recipes You Can Make */}
              <section className="space-y-12">
                <div className="flex items-end justify-between border-b border-stone-100 pb-6">
                  <h2 className="text-3xl font-serif text-brand">Ready to Cook</h2>
                  <span className="micro-label">
                    {recipes.filter(r => r.matched?.length === included.length).length} matches
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-10">
                  {recipes.filter(r => r.matched?.length === included.length).map((recipe) => (
                    <RecipeCard 
                      key={recipe.id}
                      recipe={recipe} 
                      included={included} 
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      setSelectedRecipe={setSelectedRecipe}
                    />
                  ))}
                  {recipes.filter(r => r.matched?.length === included.length).length === 0 && (
                    <div className="md:col-span-2 py-20 text-center bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-200">
                      <p className="text-stone-400 italic">No perfect matches. Try adding more ingredients!</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Recipes You Can Consider */}
              <section className="space-y-12">
                <div className="flex items-end justify-between border-b border-stone-100 pb-6">
                  <h2 className="text-3xl font-serif">Almost There</h2>
                  <span className="micro-label">
                    {recipes.filter(r => r.matched?.length && r.matched.length > 0 && r.matched.length < included.length).length} matches
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-10">
                  {recipes.filter(r => r.matched?.length && r.matched.length > 0 && r.matched.length < included.length).map((recipe) => (
                    <RecipeCard 
                      key={recipe.id}
                      recipe={recipe} 
                      included={included} 
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      setSelectedRecipe={setSelectedRecipe}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="space-y-12">
              <div className="flex items-end justify-between border-b border-stone-100 pb-6">
                <h2 className="text-3xl font-serif">Explore All</h2>
                <span className="micro-label">{recipes.length} recipes</span>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                {recipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id}
                    recipe={recipe} 
                    included={included} 
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    setSelectedRecipe={setSelectedRecipe}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  included: string[];
  favorites: number[];
  toggleFavorite: (id: number) => void;
  setSelectedRecipe: (r: Recipe) => void;
}

function RecipeCard({ recipe, included, favorites, toggleFavorite, setSelectedRecipe }: RecipeCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="recipe-card group cursor-pointer"
      onClick={() => setSelectedRecipe(recipe)}
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={recipe.image} 
          alt={recipe.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(recipe.id);
          }}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-all hover:scale-110 active:scale-95"
        >
          <Bookmark className={`w-4 h-4 ${favorites.includes(recipe.id) ? 'fill-brand text-brand' : 'text-stone-400'}`} />
        </button>
        
        <div className="absolute bottom-6 left-6">
          <div className="flex items-center space-x-2">
            <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-600 flex items-center">
              <Clock className="w-3 h-3 mr-2" /> {recipe.cookTime} MIN
            </span>
            {recipe.score > 80 && (
              <span className="bg-brand text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center">
                Best Match
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <h3 className="text-xl font-bold mb-6 group-hover:text-brand transition-colors leading-tight">{recipe.name}</h3>
        
        <div className="flex flex-wrap gap-2">
          {recipe.ingredients.slice(0, 4).map((ing, idx) => {
            const isMatched = included.map(i => i.toLowerCase()).includes(ing.toLowerCase());
            return (
              <span key={idx} className={`tag ${isMatched ? 'tag-included' : 'tag-outline'}`}>
                {isMatched ? <Check className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                {ing}
              </span>
            );
          })}
          {recipe.ingredients.length > 4 && (
            <span className="text-[10px] font-bold text-stone-400 pt-1">+{recipe.ingredients.length - 4} more</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
