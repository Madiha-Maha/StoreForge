import React, { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Sparkles, ShoppingBag, Star, ArrowRight, Check } from 'lucide-react';
import { ProductCategory, Product, CurrencyCode } from '../types';
import { formatMoney } from '../store.config';
import { generateSuggestionsForQuery } from '../utils/productSuggestions';

interface ProductFiltersProps {
  categories: ProductCategory[];
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  onSortChange: (sort: 'featured' | 'price-asc' | 'price-desc' | 'rating') => void;
  inStockOnly: boolean;
  onToggleInStockOnly: (val: boolean) => void;
  categoryCounts: Record<string, number>;
  brandColor: string;
  products?: Product[];
  currency?: CurrencyCode;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onOpenSearchModal?: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  inStockOnly,
  onToggleInStockOnly,
  categoryCounts = {},
  brandColor,
  products = [],
  currency = 'USD',
  onSelectProduct,
  onAddToCart,
  onOpenSearchModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Register dynamically suggested product on server
  const registerProductWithServer = (p: Product) => {
    fetch('/api/products/upsert-suggested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).catch(() => {});
  };

  // Compute live suggestions to buy
  const suggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Return top 3 featured items to buy
      return products
        .filter((p) => p.featured || p.rating >= 4.9)
        .slice(0, 3);
    }
    const directMatches = products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q)
      );
    });

    if (directMatches.length >= 4) {
      return directMatches.slice(0, 4);
    }

    // Always generate smart product suggestions for whatever the user types (e.g. shoes, jacket, etc.)
    const generated = generateSuggestionsForQuery(searchQuery, products);
    const combined = [...directMatches];
    const seen = new Set(directMatches.map((p) => p.name.toLowerCase()));
    generated.forEach((item) => {
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        combined.push(item);
      }
    });

    return combined.slice(0, 4);
  }, [searchQuery, products]);

  const handleQuickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    registerProductWithServer(p);
    if (onAddToCart) {
      onAddToCart(p);
      setAddedId(p.id);
      setTimeout(() => setAddedId(null), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar with Live Suggestions Dropdown */}
        <div ref={containerRef} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search products to buy (e.g. keyboard, headphones)..."
            className="w-full pl-10 pr-16 py-2.5 text-xs rounded-xl border border-neutral-300/80 bg-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-sm"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenSearchModal && (
              <button
                type="button"
                onClick={onOpenSearchModal}
                className="hidden sm:inline-block text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 hover:bg-neutral-200 transition-colors"
                title="Open Expanded Search & Recommendations (Cmd+K)"
              >
                ⌘K
              </button>
            )}
          </div>

          {/* Floating Live Suggestions Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-neutral-200/90 py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {searchQuery.trim()
                      ? `Suggestions to Buy (${suggestions.length})`
                      : 'Recommended Products to Buy'}
                  </span>
                </div>
                {onOpenSearchModal && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSearchModal();
                    }}
                    className="text-neutral-600 hover:text-neutral-950 font-semibold normal-case flex items-center gap-0.5"
                  >
                    <span>Full view</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {suggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  <p>No exact product suggestions found for &ldquo;{searchQuery}&rdquo;</p>
                  {onOpenSearchModal && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenSearchModal();
                      }}
                      className="mt-2 text-xs font-bold text-neutral-900 underline"
                    >
                      Browse popular alternatives
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {suggestions.map((p) => {
                    const isAdded = addedId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (onSelectProduct) {
                            registerProductWithServer(p);
                            onSelectProduct(p);
                            setIsDropdownOpen(false);
                          }
                        }}
                        className="px-3.5 py-2.5 hover:bg-neutral-50 flex items-center gap-3 cursor-pointer transition-colors group"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate group-hover:text-amber-900">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-extrabold text-neutral-900">
                              {formatMoney(p.basePrice, currency)}
                            </span>
                            {p.compareAtPrice && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                {formatMoney(p.compareAtPrice, currency)}
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 text-[10px] text-amber-700">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{p.rating}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, p)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                          }`}
                          title="Add to Cart directly"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3 h-3" />
                              <span>Buy</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sort & Stock Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onToggleInStockOnly(e.target.checked)}
              className="rounded text-neutral-900 focus:ring-neutral-900 w-4 h-4"
            />
            <span>In Stock Only</span>
          </label>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 border border-neutral-300 rounded-xl px-3 py-2 bg-white text-xs shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent font-medium text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
              style={isSelected ? { backgroundColor: brandColor } : undefined}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

