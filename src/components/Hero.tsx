import React from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Zap, Award } from 'lucide-react';
import { StoreConfig } from '../types';

interface HeroProps {
  config: StoreConfig;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ config, onExploreClick }) => {
  return (
    <div className="relative overflow-hidden bg-neutral-900 text-white">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 opacity-95" />
      <div
        className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: config.brandColor }}
      />
      <div
        className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: config.accentColor }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-neutral-200 backdrop-blur">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Production-Grade Multi-Gateway Architecture</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Engineered Goods. <br />
              <span className="text-neutral-400">Zero-Compromise Quality.</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 max-w-xl font-normal leading-relaxed">
              Curated everyday carry, precision workspace tools, and acoustic engineering. Designed with high-performance materials and built to outlast trends.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: config.brandColor === '#0f172a' ? '#ffffff' : config.brandColor, color: config.brandColor === '#0f172a' ? '#0f172a' : '#ffffff' }}
              >
                <span>Shop The Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/5 border border-white/10 px-4 py-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Stripe &amp; Razorpay 3D-Secure Protected</span>
              </div>
            </div>
          </div>

          {/* Featured Visual Spotlight Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-3 backdrop-blur shadow-2xl">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85"
                  alt="AeroWave Pro ANC Headphones"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-neutral-950 mb-1">
                    Staff Choice
                  </span>
                  <p className="font-display font-bold text-lg leading-snug">AeroWave Pro ANC Wireless</p>
                  <p className="text-xs text-neutral-300">Custom titanium drivers • 48dB active cancellation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Free Express Shipping</p>
                <p className="text-neutral-400">On all orders over $100</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sky-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Dual Gateways</p>
                <p className="text-neutral-400">Stripe &amp; Razorpay UPI</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-400 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">30-Day Hassle-Free Returns</p>
                <p className="text-neutral-400">Automated refund workflow</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Idempotent Webhooks</p>
                <p className="text-neutral-400">Zero duplicate orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
