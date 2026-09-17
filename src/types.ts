export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateAgainstUSD: number; // For multi-currency conversion
  position: 'prefix' | 'suffix';
}

export type ProductCategory = 'All' | 'Audio' | 'Workspace' | 'EDC & Carry' | 'Lifestyle' | string;

export interface StoreConfig {
  storeName: string;
  tagline: string;
  brandColor: string; // Hex e.g. #0f172a or #0d9488 or #4f46e5
  accentColor: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontHeading?: string;
  fontBody?: string;
  currency: CurrencyCode;
  taxRatePercent: number;
  freeShippingThreshold: number;
  stripeEnabled: boolean;
  razorpayEnabled: boolean;
  codEnabled: boolean;
  supportEmail: string;
  supportPhone: string;
  returnPolicyDays: number;
  announcementText?: string;
  announcementBanner?: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Matte Black / Large"
  sku: string;
  color?: string;
  colorHex?: string;
  size?: string;
  material?: string;
  priceDelta: number; // difference from base price
  stock: number;
  image?: string;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  category: string;
  tags: string[];
  images: string[];
  featured: boolean;
  badge?: 'Best Seller' | 'New' | 'Limited Run' | 'Staff Pick' | string;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  specifications: Record<string, string>;
  totalStock: number;
  isDigital?: boolean;
}

export interface CartItem {
  id: string; // composite cart item id: `${productId}-${variantId}`
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentGateway = 'stripe' | 'razorpay' | 'cod';

export interface Address {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "SF-10492"
  customerId?: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  shippingCost: number;
  shippingMethod: string;
  taxAmount: number;
  totalAmount: number;
  currency: CurrencyCode;
  currencySymbol: string;
  paymentGateway: PaymentGateway;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentTransactionId?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  refundAmount?: number;
  refundReason?: string;
  notes?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number; // e.g. 15 for 15% or 20 for $20 off
  minOrderValue: number;
  maxUses?: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  savedAddresses: Address[];
  savedCards: {
    id: string;
    brand: 'visa' | 'mastercard' | 'amex';
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  }[];
}

export interface WebhookLog {
  id: string;
  gateway: 'stripe' | 'razorpay';
  eventType: string;
  eventId: string;
  orderId?: string;
  idempotencyKey?: string;
  status: 'processed' | 'duplicate_skipped' | 'failed';
  receivedAt: string;
  payloadSummary: string;
}

export interface TransactionalEmail {
  id: string;
  to: string;
  subject: string;
  type: 'order_confirmation' | 'shipping_update' | 'refund_receipt' | 'abandoned_cart';
  orderNumber?: string;
  sentAt: string;
  htmlBody: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  entityType: 'order' | 'product' | 'discount' | 'gateway';
  entityId?: string;
}

export interface AnalyticsData {
  grossRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionFunnel: {
    stage: string;
    count: number;
    rate: number;
  }[];
  revenueHistory: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    unitsSold: number;
    revenue: number;
    stockRemaining: number;
  }[];
  lowStockItems: {
    id: string;
    name: string;
    stock: number;
  }[];
}
