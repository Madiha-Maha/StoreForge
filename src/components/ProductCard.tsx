import React, { useState } from 'react';
import { Heart, Star, ShoppingBag, Eye, Check } from 'lucide-react';
import { Product, CurrencyCode } from '../types';
import { formatMoney } from '../store.config';

interface ProductCardProps {
  product: Product;
  currency: CurrencyCode;
  brandColor: string;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, variantId?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  brandColor,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = product.variants[selectedVariantIndex];
  const activePrice = product.basePrice + (selectedVariant ? selectedVariant.priceDelta : 0);
  const isOutOfStock = product.totalStock <= 0;
  const isLowStock = product.totalStock > 0 && product.totalStock <= 5;

  const currentImage =
    selectedVariant?.image ||
    (isHovered && product.images[1] ? product.images[1] : product.images[0]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, selectedVariant?.id);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div
      className="group relative bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-300 overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col cursor-pointer"
      onClick={() => onQuickView(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
        <img
          src={currentImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-neutral-900 text-white shadow-sm">
              {product.badge}
            </span>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500 text-white shadow-sm">
              Save {Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur transition-all shadow-sm z-10 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-500 scale-110'
              : 'bg-white/80 text-neutral-600 hover:bg-white hover:text-neutral-900'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Quick View Hover Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-lg bg-white/95 text-neutral-800 text-xs font-semibold shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 backdrop-blur flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Quick View</span>
        </button>
      </div>

      {/* Product Details Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-600">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-neutral-800">{product.rating}</span>
              <span className="text-[11px] text-neutral-600">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-neutral-900 text-base leading-snug group-hover:text-neutral-700 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-neutral-600 line-clamp-1 mt-1 font-normal">
            {product.tagline}
          </p>

          {/* Variant Color Chips */}
          {product.variants.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3">
              {product.variants.map((variant, idx) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariantIndex(idx);
                  }}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    selectedVariantIndex === idx
                      ? 'ring-2 ring-neutral-900 ring-offset-1 scale-110'
                      : 'border-neutral-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: variant.colorHex || '#475569' }}
                  title={variant.name}
                  aria-label={variant.name}
                />
              ))}
              <span className="text-[11px] text-neutral-600 ml-1">
                {product.variants.length} options
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Add To Cart CTA */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-bold text-neutral-900">
                {formatMoney(activePrice, currency)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > activePrice && (
                <span className="text-xs text-neutral-600 line-through">
                  {formatMoney(product.compareAtPrice, currency)}
                </span>
              )}
            </div>

            {/* Stock status indicator */}
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block animate-pulse">
                Only {product.totalStock} left
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-600 block">
                In Stock &bull; Ships Today
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'text-white hover:opacity-90'
            }`}
            style={!isOutOfStock && !justAdded ? { backgroundColor: brandColor } : undefined}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
