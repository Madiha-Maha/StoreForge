import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  Tag,
  Check,
} from 'lucide-react';
import { CartItem, CurrencyCode, StoreConfig } from '../types';
import { formatMoney } from '../store.config';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  currency: CurrencyCode;
  config: StoreConfig;
  appliedDiscount: { code: string; discountAmount: number; description: string } | null;
  onApplyDiscount: (code: string) => Promise<boolean>;
  onRemoveDiscount: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  currency,
  config,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Subtotal calculation
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const estimatedTax = Math.round(taxableSubtotal * (config.taxRatePercent / 100) * 100) / 100;
  const freeShipThreshold = config.freeShippingThreshold || 100;
  const isFreeShipping = subtotal >= freeShipThreshold;
  const shippingAmount = isFreeShipping || subtotal === 0 ? 0 : 9.50;
  const finalTotal = subtotal > 0 ? Math.round((taxableSubtotal + estimatedTax + shippingAmount) * 100) / 100 : 0;

  const freeShipProgress = Math.min(100, Math.round((subtotal / freeShipThreshold) * 100));
  const amountNeededForFreeShip = Math.max(0, freeShipThreshold - subtotal);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const ok = await onApplyDiscount(promoInput.trim());
      if (ok) {
        setPromoInput('');
      } else {
        setPromoError('Invalid coupon code or minimum subtotal not met.');
      }
    } catch {
      setPromoError('Failed to validate promo code.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h2 className="font-display font-bold text-lg text-neutral-900">Your Shopping Bag</h2>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-neutral-700" />
                {isFreeShipping ? (
                  <span className="text-emerald-700 font-bold">You unlocked Free Express Shipping!</span>
                ) : (
                  <span>
                    Add <strong className="text-neutral-950">{formatMoney(amountNeededForFreeShip, currency)}</strong> more for Free Shipping
                  </span>
                )}
              </span>
              <span className="font-bold text-neutral-500">{freeShipProgress}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${freeShipProgress}%`,
                  backgroundColor: isFreeShipping ? '#059669' : config.brandColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900">Your bag is empty</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Discover precision audio, full-grain leather goods, and refined workspace gear.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-opacity shadow-sm"
                style={{ backgroundColor: config.brandColor }}
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3 rounded-2xl border border-neutral-200/80 bg-white hover:border-neutral-300 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-100">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-xs text-neutral-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.variant && (
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {item.variant.name}
                      </p>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                    <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-neutral-500 hover:bg-neutral-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-neutral-500 hover:bg-neutral-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-display font-bold text-xs text-neutral-900">
                      {formatMoney(item.unitPrice * item.quantity, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50/80 space-y-4">
            {/* Promo Code Input */}
            <div>
              {appliedDiscount ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-800 uppercase tracking-wide">
                        {appliedDiscount.code}
                      </span>
                      <span className="text-emerald-700 ml-1">
                        (-{formatMoney(appliedDiscount.discountAmount, currency)})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onRemoveDiscount}
                    className="text-emerald-800 hover:text-rose-600 font-semibold text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Promo code (try WELCOME15)"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white uppercase font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                    >
                      {isApplyingPromo ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-rose-600 pl-1">{promoError}</p>
                  )}
                </form>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-neutral-600 border-t border-neutral-200/60 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatMoney(subtotal, currency)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatMoney(discountAmount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>{shippingAmount === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : formatMoney(shippingAmount, currency)}</span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Tax ({config.taxRatePercent}%)</span>
                <span>{formatMoney(estimatedTax, currency)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span className="font-display text-base">{formatMoney(finalTotal, currency)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 px-5 rounded-xl text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: config.brandColor }}
            >
              <span>Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Stripe &amp; Razorpay 256-Bit
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Carbon-Neutral Delivery
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
