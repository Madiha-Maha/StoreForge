import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  SlidersHorizontal,
  User,
  ShieldCheck,
  Globe,
  Sparkles,
  X,
} from 'lucide-react';
import { StoreConfig, CurrencyCode } from '../types';
import { CURRENCIES, formatMoney } from '../store.config';

interface NavbarProps {
  config: StoreConfig;
  cartCount?: number;
  cartTotal?: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenSearch?: () => void;
  onOpenAdmin?: () => void;
  onOpenAccount?: () => void;
  onOpenReskin?: () => void;
  onOpenThemeCustomizer?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  categories?: string[];
  currentCurrency?: CurrencyCode;
  currency?: CurrencyCode;
  onChangeCurrency?: (curr: CurrencyCode) => void;
  onCurrencyChange?: (curr: CurrencyCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  cartCount = 0,
  cartTotal = 0,
  wishlistCount = 0,
  onOpenCart = () => {},
  onOpenWishlist = () => {},
  onOpenSearch = () => {},
  onOpenAdmin = () => {},
  onOpenAccount = () => {},
  onOpenReskin,
  onOpenThemeCustomizer,
  selectedCategory = 'All',
  onSelectCategory = (_cat: string) => {},
  categories = [],
  currentCurrency,
  currency,
  onChangeCurrency = (_curr: CurrencyCode) => {},
  onCurrencyChange,
}) => {
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

  const activeCurrency: CurrencyCode = currentCurrency || currency || config.currency || 'USD';
  const handleCurrencyChange = onChangeCurrency || onCurrencyChange || (() => {});
  const handleReskin = onOpenReskin || onOpenThemeCustomizer || (() => {});
  const safeCategories = (Array.isArray(categories) ? categories : []).filter((c) => c !== 'All');

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-neutral-200">
      {/* Announcement Bar */}
      {showAnnouncement && config.announcementText && (
        <div
          className="text-xs py-2 px-4 text-white text-center font-medium flex items-center justify-center relative transition-colors"
          style={{ backgroundColor: config.brandColor }}
        >
          <span className="truncate max-w-[90%]">{config.announcementText}</span>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 p-1 text-white"
            aria-label="Close announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onSelectCategory('All')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: config.brandColor }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight text-neutral-900 block leading-tight">
                  {config.storeName}
                </span>
                <span className="text-[10px] tracking-wider uppercase text-neutral-400 font-semibold block">
                  Studio Storefront
                </span>
              </div>
            </button>

            {/* Desktop Category Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => onSelectCategory('All')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                All Products
              </button>
              {safeCategories.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          {/* Action Icons Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger Button / Pill */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 bg-neutral-100/80 hover:bg-neutral-100 rounded-xl transition-all border border-neutral-200/60 group"
              title="Search products to buy (⌘K or /)"
              aria-label="Search products"
            >
              <Search className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              <span className="hidden md:inline text-xs font-medium text-neutral-500 group-hover:text-neutral-700">
                Search products to buy...
              </span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-400 bg-white rounded border border-neutral-200 shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                aria-label="Select currency"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span>{activeCurrency}</span>
                <span className="text-neutral-400 text-[10px]">({CURRENCIES[activeCurrency]?.symbol || '$'})</span>
              </button>

              {currencyMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase">
                    Select Currency
                  </div>
                  {Object.keys(CURRENCIES).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        handleCurrencyChange(curr as CurrencyCode);
                        setCurrencyMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-50 ${
                        activeCurrency === curr ? 'font-bold text-neutral-900 bg-neutral-100' : 'text-neutral-600'
                      }`}
                    >
                      <span>{curr}</span>
                      <span className="text-neutral-400 font-mono">{CURRENCIES[curr].symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* White-Label Reskinning Drawer Trigger */}
            <button
              onClick={handleReskin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              title="Customize Storefront Theme, Branding & Colors for Clients"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
              <span>Reskin Store</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Wishlist"
              title="Saved Items"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Customer Account / Orders */}
            <button
              onClick={onOpenAccount}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Customer Account & Orders"
              title="My Account & Orders"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Admin Panel Toggle */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
              title="Open Merchant Admin Dashboard"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl text-white font-medium text-sm transition-all shadow-sm hover:opacity-95 active:scale-95"
              style={{ backgroundColor: config.brandColor }}
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 bg-amber-400 text-neutral-950 text-[10px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold">
                {formatMoney(cartTotal, activeCurrency)}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Category Scroll */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 border-t border-neutral-100 no-scrollbar">
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            All Products
          </button>
          {safeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
