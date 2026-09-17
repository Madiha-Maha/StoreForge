import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  Star,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, CurrencyCode, ProductCategory } from '../types';
import { formatMoney } from '../store.config';
import { generateSuggestionsForQuery } from '../utils/productSuggestions';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: CurrencyCode;
  brandColor: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number) => void;
  onOpenCart?: () => void;
  selectedCategory?: string;
  onFilterByCategory?: (category: ProductCategory) => void;
}

const POPULAR_SEARCHES = [
  'ANC Headphones',
  'Mechanical Keyboard',
  'Leather Weekender',
  'Monitor Riser',
  'Titanium Wallet',
  'Pour-Over Set',
  'Merino Desk Mat',
  'Cast Iron Teapot',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products = [],
  currency,
  brandColor,
  onSelectProduct,
  onAddToCart,
  onOpenCart,
  onFilterByCategory,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('storeforge_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('storeforge_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('storeforge_recent_searches');
    } catch {
      // ignore
    }
  };

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Matching algorithm
  const { matchingProducts, matchingCategories, isSuggestedMatch } = useMemo(() => {
    const q = query.trim().toLowerCase();

    // If query is empty, offer featured / top-rated recommendations
    if (!q) {
      const trending = [...products]
        .filter((p) => activeCategoryFilter === 'All' || p.category.toLowerCase() === activeCategoryFilter.toLowerCase())
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating)
        .slice(0, 6);

      return {
        matchingProducts: trending,
        matchingCategories: [],
        isSuggestedMatch: false,
      };
    }

    // Direct product matching
    const matches = products.filter((p) => {
      if (activeCategoryFilter !== 'All' && p.category.toLowerCase() !== activeCategoryFilter.toLowerCase()) {
        return false;
      }

      const nameMatch = p.name.toLowerCase().includes(q);
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(q));
      const catMatch = p.category.toLowerCase().includes(q);
      const taglineMatch = p.tagline.toLowerCase().includes(q);
      const descMatch = p.description.toLowerCase().includes(q);
      const specMatch = p.specifications && Object.values(p.specifications).some((s) => String(s).toLowerCase().includes(q));

      return nameMatch || tagMatch || catMatch || taglineMatch || descMatch || specMatch;
    });

    // Score relevance: exact title match > starts with title > tag/desc match
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(q) ? 2 : aName.includes(q) ? 1 : 0;
      const bStarts = bName.startsWith(q) ? 2 : bName.includes(q) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;
      return b.rating - a.rating;
    });

    // Category matches
    const catMatches: { category: string; count: number }[] = [];
    categories.forEach((cat) => {
      if (cat === 'All') return;
      if (cat.toLowerCase().includes(q)) {
        const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
        catMatches.push({ category: cat, count });
      }
    });

    // Generate buyable suggestions so ANY query always shows relevant product suggestions to buy!
    let finalProducts = [...matches];
    let isSuggested = false;

    if (finalProducts.length < 4) {
      const generated = generateSuggestionsForQuery(query, products);
      const seenNames = new Set(finalProducts.map((p) => p.name.toLowerCase()));
      generated.forEach((item) => {
        if (!seenNames.has(item.name.toLowerCase())) {
          seenNames.add(item.name.toLowerCase());
          finalProducts.push(item);
        }
      });
      if (matches.length === 0) {
        isSuggested = true;
      }
    }

    return {
      matchingProducts: finalProducts,
      matchingCategories: catMatches,
      isSuggestedMatch: isSuggested,
    };
  }, [query, products, activeCategoryFilter, categories]);

  // Helper for highlighting text match
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.trim().toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-neutral-950 font-semibold rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Register dynamically suggested product on server
  const registerProductWithServer = (product: Product) => {
    fetch('/api/products/upsert-suggested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }).catch(() => {});
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = matchingProducts;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && list[activeIndex]) {
        const item = list[activeIndex];
        registerProductWithServer(item);
        saveRecentSearch(query || item.name);
        onSelectProduct(item);
        onClose();
      } else if (query.trim()) {
        saveRecentSearch(query);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    registerProductWithServer(product);
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1800);
  };

  const handleSelectProduct = (product: Product) => {
    registerProductWithServer(product);
    saveRecentSearch(query || product.name);
    onSelectProduct(product);
    onClose();
  };

  const handleSelectCategory = (cat: string) => {
    if (onFilterByCategory) {
      onFilterByCategory(cat as ProductCategory);
    }
    onClose();
  };

  if (!isOpen) return null;

  const displayList = matchingProducts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center gap-3 bg-white sticky top-0 z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            <Search className="w-5 h-5" />
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search products to buy (e.g., headphones, leather, walnut, pen)..."
              className="w-full text-sm sm:text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
            />
          </div>

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-semibold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">
            <span>ESC</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategoryFilter === cat
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Results Area */}
        <div ref={listRef} className="overflow-y-auto p-4 sm:p-5 space-y-6 flex-1">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Searches</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-[11px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  Clear history
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      saveRecentSearch(term);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs font-medium rounded-lg transition-colors group"
                  >
                    <span>{term}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Search Suggestions / Tags */}
          {!query && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Trending Searches to Buy</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      saveRecentSearch(term);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Tag className="w-3 h-3 text-amber-600" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Categories section if user is typing */}
          {query && matchingCategories.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Matching Categories
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingCategories.map((c) => (
                  <button
                    key={c.category}
                    onClick={() => handleSelectCategory(c.category)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-400 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900" />
                      <span className="text-xs font-semibold text-neutral-800">
                        View all in <strong>{c.category}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-neutral-500 bg-neutral-200/70 px-2 py-0.5 rounded-full">
                      {c.count} items
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart Suggestion Announcement when searching */}
          {query.trim() !== '' && isSuggestedMatch && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    Live Product Suggestions for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-neutral-600">
                    Curated buyable products matching your query with express delivery and full warranty.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white text-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 shrink-0 shadow-xs">
                {displayList.length} items ready to buy
              </span>
            </div>
          )}

          {/* Product Suggestions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {query.trim()
                    ? isSuggestedMatch
                      ? `Product Suggestions for "${query}" (${displayList.length})`
                      : `Matching Products (${displayList.length})`
                    : 'Recommended Products to Buy'}
                </span>
              </div>
              {displayList.length > 0 && (
                <span className="text-[11px] text-neutral-400">
                  Click product for specs or Quick Buy to add
                </span>
              )}
            </div>

            <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
              {displayList.map((product, idx) => {
                const isSelected = activeIndex === idx;
                const isAdded = addedProductId === product.id;
                const activePrice = product.basePrice;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`flex items-center justify-between p-3 sm:p-3.5 gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-100/90'
                        : 'hover:bg-neutral-50/80 bg-white'
                    }`}
                  >
                    {/* Left: Thumbnail image */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                      {product.badge && (
                        <span className="absolute top-1 left-1 bg-neutral-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Middle: Product Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                          {product.category}
                        </span>
                        {product.tags.includes('suggested') && (
                          <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300/80">
                            Suggested to Buy
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-amber-700">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{product.rating}</span>
                          <span className="text-neutral-400 text-[10px]">({product.reviewCount})</span>
                        </div>
                        {product.totalStock <= 3 && product.totalStock > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Only {product.totalStock} left
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                        {query ? highlightMatch(product.name, query) : product.name}
                      </h4>

                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                        {product.tagline}
                      </p>

                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="font-extrabold text-sm sm:text-base text-neutral-900">
                          {formatMoney(activePrice, currency)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > activePrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatMoney(product.compareAtPrice, currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Buy Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={product.totalStock <= 0}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : product.totalStock <= 0
                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                        }`}
                        title="Add to Shopping Cart instantly"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : product.totalStock <= 0 ? (
                          <span>Sold Out</span>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Quick Buy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Navigate with <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">↓</kbd></span>
            <span>Select with <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">Enter</kbd></span>
          </div>

          {onOpenCart && (
            <button
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="font-semibold text-neutral-800 hover:text-neutral-950 flex items-center gap-1 transition-colors"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
