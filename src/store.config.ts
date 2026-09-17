import { CurrencyConfig, StoreConfig } from './types';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', rateAgainstUSD: 1.0, position: 'prefix' },
  EUR: { code: 'EUR', symbol: '€', rateAgainstUSD: 0.92, position: 'prefix' },
  GBP: { code: 'GBP', symbol: '£', rateAgainstUSD: 0.79, position: 'prefix' },
  INR: { code: 'INR', symbol: '₹', rateAgainstUSD: 83.5, position: 'prefix' },
  CAD: { code: 'CAD', symbol: 'CA$', rateAgainstUSD: 1.36, position: 'prefix' },
  AUD: { code: 'AUD', symbol: 'A$', rateAgainstUSD: 1.52, position: 'prefix' },
};

export const THEME_PRESETS = [
  {
    id: 'nordic_slate',
    name: 'Nordic Slate (Modern Minimal)',
    brandColor: '#0f172a',
    accentColor: '#334155',
    bgLight: '#fafafa',
  },
  {
    id: 'emerald_luxe',
    name: 'Emerald Luxe (Botanical & Artisan)',
    brandColor: '#064e3b',
    accentColor: '#059669',
    bgLight: '#f6fbf9',
  },
  {
    id: 'terracotta_warm',
    name: 'Terracotta (Ceramics & Lifestyle)',
    brandColor: '#9a3412',
    accentColor: '#ea580c',
    bgLight: '#fffaf5',
  },
  {
    id: 'royal_indigo',
    name: 'Royal Indigo (High-End Tech)',
    brandColor: '#1e1b4b',
    accentColor: '#4f46e5',
    bgLight: '#f8f9ff',
  },
];

export interface ClientPreset {
  storeName: string;
  tagline: string;
  brandColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  announcementBanner: string;
}

export const CLIENT_PRESETS: Record<string, ClientPreset> = {
  minimal_studio: {
    storeName: 'StoreForge Studio',
    tagline: 'Precision engineered audio & refined workspace architecture',
    brandColor: '#0f172a',
    accentColor: '#334155',
    fontHeading: 'Space Grotesk / Plus Jakarta',
    fontBody: 'Plus Jakarta Sans',
    announcementBanner: '✨ Worldwide Express Delivery on Orders Over $100 • 30-Day Hassle Returns',
  },
  aura_botanicals: {
    storeName: 'Aura Botanicals & Wellness',
    tagline: 'Certified cold-pressed plant extracts & organic wellness rituals',
    brandColor: '#064e3b',
    accentColor: '#059669',
    fontHeading: 'Playfair Display / Serif',
    fontBody: 'Plus Jakarta Sans',
    announcementBanner: '🌿 Spring Harvest: 15% Off Your First Botanical Ritual with code WELCOME15',
  },
  apex_athletics: {
    storeName: 'Apex Performance Lab',
    tagline: 'Competition-grade apparel, lifting gear & endurance wearables',
    brandColor: '#b91c1c',
    accentColor: '#dc2626',
    fontHeading: 'Space Grotesk Bold',
    fontBody: 'Plus Jakarta Sans',
    announcementBanner: '⚡ Free Domestic Air Shipping on Pro-Gear Orders Over $75',
  },
  nomad_roasters: {
    storeName: 'Nomad Artisan Roasters',
    tagline: 'Single-origin microlot coffees roasted weekly in small batches',
    brandColor: '#78350f',
    accentColor: '#b45309',
    fontHeading: 'Newsreader / Editorial Serif',
    fontBody: 'Plus Jakarta Sans',
    announcementBanner: '☕ Fresh Weekly Roast Dispatched Within 24 Hours of Grinding',
  },
};

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: 'StoreForge',
  tagline: 'Engineered Precision & Everyday Luxury',
  brandColor: '#0f172a',
  accentColor: '#334155',
  fontFamily: 'sans',
  currency: 'USD',
  taxRatePercent: 8.5,
  freeShippingThreshold: 100,
  stripeEnabled: true,
  razorpayEnabled: true,
  codEnabled: false,
  supportEmail: 'orders@storeforge.dev',
  supportPhone: '+1 (800) 492-7104',
  returnPolicyDays: 30,
  announcementText: '✨ Enjoy Free Worldwide Express Shipping on Orders Over $100 • 30-Day Hassle-Free Returns',
  announcementBanner: '✨ Enjoy Free Worldwide Express Shipping on Orders Over $100 • 30-Day Hassle-Free Returns',
};

export function formatMoney(amount: number, currencyCode: string = 'USD'): string {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = amount * curr.rateAgainstUSD;
  const formattedNumber = converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return curr.position === 'prefix'
    ? `${curr.symbol}${formattedNumber}`
    : `${formattedNumber} ${curr.symbol}`;
}
