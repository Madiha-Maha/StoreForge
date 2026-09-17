import React, { useState, useEffect, useMemo } from 'react';
import {
  Product,
  CartItem,
  StoreConfig,
  CurrencyCode,
  ProductCategory,
  Order,
  Customer,
} from './types';
import { DEFAULT_STORE_CONFIG } from './store.config';
import { INITIAL_PRODUCTS, DEMO_CUSTOMER } from './data/seedData';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { AdminPanel } from './components/AdminPanel';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { EmailOutboxModal } from './components/EmailOutboxModal';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { Sparkles } from 'lucide-react';
import { generateSuggestionsForQuery } from './utils/productSuggestions';

export default function App() {
  // Store Config & Theme
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_STORE_CONFIG.currency);

  // Products & Categories
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('storeforge_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('storeforge_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);

  // Customer Account
  const [customer, setCustomer] = useState<Customer>(DEMO_CUSTOMER);
  const [orders, setOrders] = useState<Order[]>([]);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isEmailOutboxOpen, setIsEmailOutboxOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Global keyboard shortcut for search suggestions modal (Cmd+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('storeforge_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Persist wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('storeforge_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Load products & orders from server API
  const loadData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
      }
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
      }
    } catch (err) {
      console.warn('API fetch fallback to local seed:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync currency change with config
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    setConfig((prev) => ({ ...prev, currency: newCurrency }));
  };

  // Cart operations
  const handleAddToCart = (product: Product, variantId?: string, quantity: number = 1) => {
    // If it's a dynamic or suggested product, register with server
    fetch('/api/products/upsert-suggested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }).catch(() => {});

    const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    const unitPrice = product.basePrice + (variant ? variant.priceDelta : 0);
    const cartItemId = `${product.id}-${variant?.id || 'base'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          product,
          variant,
          quantity,
          unitPrice,
        },
      ];
    });

    showToast(`Added ${quantity}x "${product.name}" to cart`);
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedDiscount(null);
  };

  // Wishlist toggle
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`);
        return prev.filter((id) => id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to wishlist`);
        return [...prev, product.id];
      }
    });
  };

  // Direct Buy Now
  const handleBuyNow = (product: Product, variantId?: string, quantity: number = 1) => {
    handleAddToCart(product, variantId, quantity);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  // Reorder all items from past order
  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        handleAddToCart(prod, undefined, item.quantity);
      }
    });
    setIsCartOpen(true);
    showToast(`Loaded ${order.items.length} items into bag for reorder!`);
  };

  // Apply discount code via server API
  const handleApplyDiscount = async (code: string): Promise<boolean> => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount({
          code: data.code,
          discountAmount: data.discountAmount,
          description: data.description,
        });
        showToast(`Promo "${code}" applied: saved $${data.discountAmount}`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
  };

  // Filter and sort products
  const { filteredProducts, isSuggestionResult } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);

        const matchesStock = !inStockOnly || p.totalStock > 0;

        return matchesCategory && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
        if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // featured order
      });

    if (matches.length > 0 || !q) {
      return { filteredProducts: matches, isSuggestionResult: false };
    }

    // Zero matches: generate live buyable product suggestions so searching anything shows suggestions to buy!
    const suggestions = generateSuggestionsForQuery(searchQuery, products);
    return { filteredProducts: suggestions, isSuggestionResult: true };
  }, [products, selectedCategory, searchQuery, inStockOnly, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const categories: ProductCategory[] = [
    'All',
    'Audio',
    'Workspace',
    'EDC & Carry',
    'Lifestyle',
  ];

  return (
    <div
      className="min-h-screen bg-neutral-50/50 text-neutral-900 selection:bg-neutral-900 selection:text-white"
      style={{
        '--brand-color': config.brandColor,
        '--accent-color': config.accentColor,
      } as React.CSSProperties}
    >
      {/* Toast alert popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-neutral-900 text-white rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-neutral-700 animate-in slide-in-from-bottom-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        config={config}
        currency={currency}
        currentCurrency={currency}
        onCurrencyChange={handleCurrencyChange}
        onChangeCurrency={handleCurrencyChange}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        cartTotal={cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)}
        wishlistCount={wishlist.length}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => {
          setSelectedCategory('All');
          showToast(`Showing ${wishlist.length} items in your wishlist`);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenThemeCustomizer={() => setIsThemeOpen(true)}
        onOpenReskin={() => setIsThemeOpen(true)}
      />

      {/* Hero Banner Showcase */}
      <Hero
        config={config}
        onShopNow={() => {
          const el = document.getElementById('catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenCustomizer={() => setIsThemeOpen(true)}
      />

      {/* Main Catalog & Shopping Experience */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.brandColor }} />
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Curated Catalog
                </span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 tracking-tight mt-1">
                Engineered for Daily Excellence
              </h2>
            </div>
            <p className="text-xs text-neutral-500 max-w-sm">
              Explore our current production run. Direct merchant checkout powered by Stripe and Razorpay with instant verification.
            </p>
          </div>

          {/* Filter, Search & Category Bar with Live Suggestions Dropdown */}
          <ProductFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            inStockOnly={inStockOnly}
            onToggleInStockOnly={setInStockOnly}
            categoryCounts={categoryCounts}
            brandColor={config.brandColor}
            products={products}
            currency={currency}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => {
              handleAddToCart(p);
              showToast(`Added ${p.name} to bag`);
            }}
            onOpenSearchModal={() => setIsSearchOpen(true)}
          />

          {/* Smart suggestions announcement when search query yielded suggested products */}
          {isSuggestionResult && searchQuery && (
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">
                    Smart Product Suggestions to Buy for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-neutral-600">
                    Live curated buyable items matching your search with instant checkout and warranty.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-neutral-800 hover:text-neutral-950 bg-white px-3.5 py-2 rounded-xl border border-neutral-200 shadow-xs shrink-0 self-end sm:self-auto"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-neutral-200 p-8 space-y-3">
              <p className="font-display font-bold text-base text-neutral-900">
                No matching products found
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try loosening your search terms, clearing filters, or checking back soon for our next drop.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setInStockOnly(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white mt-2"
                style={{ backgroundColor: config.brandColor }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  brandColor={config.brandColor}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={(p, vId) => handleAddToCart(p, vId, 1)}
                  onQuickView={(p) => {
                    fetch('/api/products/upsert-suggested', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(p),
                    }).catch(() => {});
                    setSelectedProduct(p);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer
        config={config}
        onOpenThemeCustomizer={() => setIsThemeOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* MODALS & DRAWERS */}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currency={currency}
        config={config}
        appliedDiscount={appliedDiscount}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal with Stripe & Razorpay */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        currency={currency}
        config={config}
        appliedDiscount={appliedDiscount}
        customer={customer}
        onOrderCreated={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          loadData();
        }}
        onClearCart={handleClearCart}
        onOpenInvoice={(order) => setInvoiceOrder(order)}
        onOpenEmailOutbox={() => setIsEmailOutboxOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        currency={currency}
        brandColor={config.brandColor}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        allProducts={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Customer Account & Order History Modal */}
      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        customer={customer}
        orders={orders}
        currency={currency}
        brandColor={config.brandColor}
        onOpenInvoice={(order) => setInvoiceOrder(order)}
        onReorder={handleReorder}
      />

      {/* Admin Panel (Order fulfillment, Webhook tester, Catalog, Discounts) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        currency={currency}
        onRefreshData={loadData}
        onOpenInvoice={(order) => setInvoiceOrder(order)}
      />

      {/* Theme & White-Label Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        config={config}
        onUpdateConfig={(newConfig) => {
          setConfig(newConfig);
          setCurrency(newConfig.currency);
          showToast(`Applied theme preset "${newConfig.storeName}"`);
        }}
      />

      {/* Transactional Email Outbox Inspector Modal */}
      <EmailOutboxModal
        isOpen={isEmailOutboxOpen}
        onClose={() => setIsEmailOutboxOpen(false)}
      />

      {/* Printable Commercial Tax Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        config={config}
        currency={currency}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* Interactive Live Search & Product Suggestions Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        currency={currency}
        brandColor={config.brandColor}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onAddToCart={(p) => {
          handleAddToCart(p);
          showToast(`Added ${p.name} to bag`);
        }}
        onOpenCart={() => {
          setIsSearchOpen(false);
          setIsCartOpen(true);
        }}
        selectedCategory={selectedCategory}
        onFilterByCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}
