import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Heart,
  Plus,
  Minus,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Product, CurrencyCode } from '../types';
import { formatMoney } from '../store.config';

interface ProductDetailModalProps {
  product: Product | null;
  currency: CurrencyCode;
  brandColor: string;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onClose: () => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number) => void;
  onBuyNow: (product: Product, variantId?: string, quantity?: number) => void;
  allProducts: Product[];
  onSelectProduct: (p: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  brandColor,
  isWishlisted,
  onToggleWishlist,
  onClose,
  onAddToCart,
  onBuyNow,
  allProducts = [],
  onSelectProduct,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // New review state
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewsList, setReviewsList] = useState(product.reviews || []);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const selectedVariant = product.variants ? product.variants[selectedVariantIndex] : undefined;
  const activePrice = product.basePrice + (selectedVariant ? selectedVariant.priceDelta : 0);
  const currentStock = selectedVariant ? selectedVariant.stock : (product.totalStock ?? 0);
  const isOutOfStock = currentStock <= 0;

  const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
  const relatedProducts = safeAllProducts
    .filter((p) => p && p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewTitle || !newReviewComment) return;

    const newRev = {
      id: `rev_${Date.now()}`,
      author: newReviewAuthor,
      rating: newReviewRating,
      title: newReviewTitle,
      comment: newReviewComment,
      date: new Date().toISOString().split('T')[0],
      verified: true,
    };

    setReviewsList([newRev, ...reviewsList]);
    setReviewSubmitted(true);
    setNewReviewAuthor('');
    setNewReviewTitle('');
    setNewReviewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[92vh] flex flex-col">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors shadow-sm"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Gallery & Zoom */}
            <div className="md:col-span-6 space-y-3">
              <div
                className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 cursor-crosshair group"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={
                    isZoomed
                      ? {
                          transform: 'scale(1.8)',
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : undefined
                  }
                />

                {product.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase rounded-lg bg-neutral-900 text-white shadow-md">
                    {product.badge}
                  </span>
                )}

                <div className="absolute bottom-3 right-3 text-[11px] bg-black/60 text-white px-2.5 py-1 rounded-md backdrop-blur">
                  Hover to inspect detail
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIndex === idx
                          ? 'border-neutral-900 shadow-md scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Buying Details */}
            <div className="md:col-span-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    {product.category}
                  </span>
                  <button
                    onClick={() => onToggleWishlist(product)}
                    className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-rose-600 font-medium"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 mt-1">
                  {product.name}
                </h1>

                {/* Rating & Review counter */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">{product.rating}</span>
                  <span className="text-xs text-neutral-400">
                    ({reviewsList.length} verified reviews)
                  </span>
                </div>
              </div>

              {/* Price Display */}
              <div className="flex items-baseline gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                <span className="font-display text-3xl font-extrabold text-neutral-900">
                  {formatMoney(activePrice, currency)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > activePrice && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">
                      {formatMoney(product.compareAtPrice, currency)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Save {formatMoney(product.compareAtPrice - activePrice, currency)}
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Variant Selector */}
              {product.variants.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Select Option:{' '}
                    <span className="text-neutral-500 font-normal">
                      {selectedVariant?.name}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map((variant, idx) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          selectedVariantIndex === idx
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {variant.colorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                              style={{ backgroundColor: variant.colorHex }}
                            />
                          )}
                          <span className="truncate font-medium">{variant.name}</span>
                        </div>
                        {variant.priceDelta !== 0 && (
                          <span className="text-[11px] opacity-80 shrink-0 ml-1">
                            +{formatMoney(variant.priceDelta, currency)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="text-xs">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Out of Stock — Backorder Available
                  </span>
                ) : currentStock <= 5 ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-4 h-4" /> Only {currentStock} units remaining in stock
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> In stock • Ready for same-day dispatch
                  </span>
                )}
              </div>

              {/* Quantity Stepper & Add to Cart Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="p-2.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-neutral-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      disabled={quantity >= currentStock || isOutOfStock}
                      className="p-2.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => onAddToCart(product, selectedVariant?.id, quantity)}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm text-white transition-all shadow-md hover:opacity-95 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={!isOutOfStock ? { backgroundColor: brandColor } : undefined}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag &bull; {formatMoney(activePrice * quantity, currency)}</span>
                  </button>
                </div>

                {/* Buy Now Direct Button */}
                <button
                  onClick={() => onBuyNow(product, selectedVariant?.id, quantity)}
                  disabled={isOutOfStock}
                  className="w-full py-3 px-4 rounded-xl border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-900 font-semibold text-xs transition-colors hover:bg-neutral-50 disabled:opacity-40"
                >
                  Instant Checkout with Stripe or Razorpay
                </button>
              </div>

              {/* Guarantees Box */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 text-center text-[11px] text-neutral-500">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-neutral-700" />
                  <span>Free Express $100+</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-neutral-700" />
                  <span>30-Day Hassle Returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Info Section (Specifications & Customer Reviews) */}
          <div className="border-t border-neutral-200 pt-6">
            <div className="flex items-center gap-6 border-b border-neutral-200 pb-3">
              <button
                onClick={() => setActiveTab('details')}
                className={`text-sm font-semibold pb-2 -mb-3 transition-colors ${
                  activeTab === 'details'
                    ? 'border-b-2 border-neutral-900 text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Product Story
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`text-sm font-semibold pb-2 -mb-3 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-b-2 border-neutral-900 text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Technical Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`text-sm font-semibold pb-2 -mb-3 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-neutral-900 text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Verified Reviews ({reviewsList.length})
              </button>
            </div>

            <div className="pt-5">
              {activeTab === 'details' && (
                <div className="prose prose-sm text-neutral-600 max-w-none space-y-3 font-normal">
                  <p>{product.description}</p>
                  <p>
                    Every piece in our {product.category} collection undergoes exhaustive stress-testing
                    and hand inspection prior to shipment. Serialized authenticity certificate included in each retail package.
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    {Object.entries(product.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1.5 border-b border-neutral-200/60">
                        <dt className="text-neutral-500 font-medium">{key}</dt>
                        <dd className="font-semibold text-neutral-900 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-neutral-900">{rev.author}</span>
                            {rev.verified && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400">{rev.date}</span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`}
                            />
                          ))}
                        </div>
                        <p className="font-semibold text-xs text-neutral-900">{rev.title}</p>
                        <p className="text-xs text-neutral-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReview} className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3">
                    <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-neutral-700" />
                      <span>Write a Verified Customer Review</span>
                    </h4>

                    {reviewSubmitted && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Your review was published successfully!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Rating</label>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                        >
                          <option value={5}>5 Stars - Outstanding</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Average</option>
                          <option value={2}>2 Stars - Below Expectations</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Review Headline</label>
                      <input
                        type="text"
                        required
                        value={newReviewTitle}
                        onChange={(e) => setNewReviewTitle(e.target.value)}
                        placeholder="e.g. Exceptional craftsmanship"
                        className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Your Feedback</label>
                      <textarea
                        required
                        rows={3}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Describe build quality, packaging, and real-world performance..."
                        className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Post Review
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-neutral-200 pt-6">
              <h3 className="font-display font-bold text-base text-neutral-900 mb-4">
                Customers Also Looked At
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectProduct(rel);
                      setActiveImageIndex(0);
                      setSelectedVariantIndex(0);
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3 hover:border-neutral-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-2">
                      <img src={rel.images[0]} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="font-semibold text-xs text-neutral-900 truncate">{rel.name}</p>
                    <p className="font-bold text-xs text-neutral-800 mt-0.5">{formatMoney(rel.basePrice, currency)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
