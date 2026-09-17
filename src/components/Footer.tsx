import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  Lock,
  Heart,
} from 'lucide-react';
import { StoreConfig } from '../types';

interface FooterProps {
  config: StoreConfig;
  onOpenThemeCustomizer: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  config,
  onOpenThemeCustomizer,
  onOpenAdmin,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setIsSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-neutral-900 text-white mt-20 border-t border-neutral-800">
      {/* Guarantees Bar */}
      <div className="border-b border-neutral-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-white">Free Express Shipping</h4>
              <p className="text-[11px] text-neutral-400">On all orders over ${config.freeShippingThreshold || 100}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-white">Secure Encrypted Payments</h4>
              <p className="text-[11px] text-neutral-400">Direct Stripe &amp; Razorpay 256-Bit SSL</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-white">30-Day Hassle Returns</h4>
              <p className="text-[11px] text-neutral-400">Instant gateway refunds &amp; tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-white">Authenticity Certified</h4>
              <p className="text-[11px] text-neutral-400">Serialized quality assurance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: config.brandColor }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight">
                {config.storeName}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              {config.tagline}. Handcrafted minimalist gear engineered for modern creators, digital nomads, and perfectionists.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onOpenThemeCustomizer}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 transition-colors"
              >
                🎨 Reskin Theme
              </button>
              <button
                onClick={onOpenAdmin}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 transition-colors"
              >
                ⚙️ Admin Console
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Collections
            </h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><a href="#catalog" className="hover:text-white transition-colors">Acoustic Audio</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Workspace &amp; Desk</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Everyday Carry (EDC)</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Lifestyle Essentials</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Assistance
            </h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><span className="hover:text-white cursor-pointer">Order Tracking</span></li>
              <li><span className="hover:text-white cursor-pointer">Shipping &amp; Duties</span></li>
              <li><span className="hover:text-white cursor-pointer">Returns &amp; Exchanges</span></li>
              <li><span className="hover:text-white cursor-pointer">{config.supportEmail}</span></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Exclusive Member Drops
            </h5>
            <p className="text-xs text-neutral-400">
              Join 12,000+ members receiving private vault drops, early access, and secret discount codes.
            </p>

            {isSubscribed ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>You're on the VIP list. Check your inbox for WELCOME15!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-200 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright & Badges */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} {config.storeName}. All rights reserved. Powered by StoreForge.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400">Stripe Verified</span>
            <span>&bull;</span>
            <span className="text-[11px] font-mono text-neutral-400">Razorpay Verified</span>
            <span>&bull;</span>
            <span className="text-[11px] font-mono text-neutral-400">256-Bit SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
