import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Zap,
  Mail,
  RotateCcw,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ExternalLink,
  Send,
  Printer,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  Product,
  Order,
  DiscountCode,
  StoreConfig,
  CurrencyCode,
  AnalyticsData,
  WebhookLog,
  TransactionalEmail,
  AuditLog,
} from '../types';
import { formatMoney } from '../store.config';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
  currency: CurrencyCode;
  onRefreshData: () => void;
  onOpenInvoice: (order: Order) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  config,
  currency,
  onRefreshData,
  onOpenInvoice,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'products' | 'orders' | 'discounts' | 'webhooks' | 'emails' | 'audit'
  >('analytics');

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [emails, setEmails] = useState<TransactionalEmail[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  // Refund modal state
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('Customer return requested');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // New discount modal state
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscCode, setNewDiscCode] = useState('');
  const [newDiscDesc, setNewDiscDesc] = useState('');
  const [newDiscType, setNewDiscType] = useState<'percentage' | 'flat'>('percentage');
  const [newDiscVal, setNewDiscVal] = useState(20);
  const [newDiscMin, setNewDiscMin] = useState(100);

  // Webhook simulator state
  const [simGateway, setSimGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [simEvent, setSimEvent] = useState('payment_intent.succeeded');
  const [simOrderId, setSimOrderId] = useState('');
  const [simIsDuplicate, setSimIsDuplicate] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Abandoned cart recovery state
  const [abandonedCartEmail, setAbandonedCartEmail] = useState('shopper@example.com');
  const [recoverySentNotice, setRecoverySentNotice] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [anaRes, ordRes, prodRes, discRes, whRes, emRes, audRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/discounts'),
        fetch('/api/webhooks/logs'),
        fetch('/api/emails'),
        fetch('/api/audit-logs'),
      ]);

      setAnalytics(await anaRes.json());
      setOrders(await ordRes.json());
      setProducts(await prodRes.json());
      setDiscounts(await discRes.json());
      setWebhookLogs(await whRes.json());
      setEmails(await emRes.json());
      setAuditLogs(await audRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber: `SF-TRK-${Math.floor(100000 + Math.random() * 900000)}` }),
      });
      if (res.ok) {
        fetchAdminData();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundOrderId) return;
    setIsProcessingRefund(true);
    try {
      const res = await fetch(`/api/orders/${refundOrderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });
      if (res.ok) {
        setRefundOrderId(null);
        fetchAdminData();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newDiscCode.toUpperCase(),
          description: newDiscDesc,
          type: newDiscType,
          value: Number(newDiscVal),
          minOrderValue: Number(newDiscMin),
          expiresAt: '2027-12-31',
        }),
      });
      if (res.ok) {
        setShowAddDiscount(false);
        setNewDiscCode('');
        setNewDiscDesc('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateWebhook = async () => {
    setSimResult(null);
    try {
      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: simGateway,
          eventType: simEvent,
          orderId: simOrderId || orders[0]?.id,
          isDuplicate: simIsDuplicate,
        }),
      });
      const data = await res.json();
      setSimResult(
        data.result === 'duplicate_skipped'
          ? '🛡️ Idempotent Deduplication: Event was recognized as duplicate and safely ignored without double-crediting or duplicate stock decrement!'
          : `✅ Webhook processed successfully for order ${data.order?.orderNumber || 'test'}`
      );
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setSimResult(`❌ Error: ${err.message}`);
    }
  };

  const handleSendRecoveryEmail = async () => {
    try {
      await fetch('/api/abandoned-carts/send-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: abandonedCartEmail }),
      });
      setRecoverySentNotice(true);
      setTimeout(() => setRecoverySentNotice(false), 3000);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetStore = async () => {
    if (confirm('Reset entire store to initial seed dataset? This will restore original inventory and test orders.')) {
      await fetch('/api/reset', { method: 'POST' });
      fetchAdminData();
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base sm:text-lg">
                  StoreForge Merchant Command Center
                </h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                  Live Admin
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Payment Gateways • Order Fulfillment • Inventory Sync • Webhook Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetStore}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Reset catalog, orders and inventory to seed state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seed</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 sm:px-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: 'Sales & Analytics', icon: LayoutDashboard },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
            { id: 'products', label: `Products & Stock (${products.length})`, icon: Package },
            { id: 'discounts', label: 'Discount Codes', icon: Tag },
            { id: 'webhooks', label: 'Webhook & Idempotency', icon: Zap },
            { id: 'emails', label: `Email Outbox (${emails.length})`, icon: Mail },
            { id: 'audit', label: 'Audit Trail', icon: TrendingUp },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
                  isActive
                    ? 'border-neutral-900 text-neutral-900 bg-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-neutral-50/50">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              Loading merchant ledger and telemetry...
            </div>
          ) : (
            <>
              {/* TAB 1: ANALYTICS */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-6">
                  {/* Low Stock Alert Banner */}
                  {analytics.lowStockItems.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold block">
                          Low Inventory Warning ({analytics.lowStockItems.length} products near depletion)
                        </span>
                        <p className="text-amber-800 mt-0.5">
                          {analytics.lowStockItems.map((p) => `${p.name} (${p.stock} units left)`).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* High-level KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Gross Store Revenue
                      </span>
                      <p className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 mt-1">
                        {formatMoney(analytics.grossRevenue, currency)}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        +18.4% from last 7 days
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Total Orders
                      </span>
                      <p className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 mt-1">
                        {analytics.totalOrders}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Processed across Stripe &amp; Razorpay
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Average Order Value
                      </span>
                      <p className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 mt-1">
                        {formatMoney(analytics.averageOrderValue, currency)}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        High basket conversion rate
                      </p>
                    </div>
                  </div>

                  {/* Conversion Funnel Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                      <h3 className="font-display font-bold text-sm text-neutral-900">
                        Checkout Conversion Funnel
                      </h3>
                      <div className="space-y-3">
                        {analytics.conversionFunnel.map((step, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between font-semibold text-neutral-700">
                              <span>{step.stage}</span>
                              <span className="font-mono">
                                {step.count.toLocaleString()} ({step.rate}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                                style={{ width: `${step.rate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Products */}
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                      <h3 className="font-display font-bold text-sm text-neutral-900">
                        Top Grossing Products
                      </h3>
                      <div className="space-y-2.5">
                        {analytics.topProducts.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 last:border-none"
                          >
                            <div className="truncate max-w-[65%]">
                              <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                              <p className="text-[11px] text-neutral-400">
                                {p.unitsSold} units sold &bull; {p.stockRemaining} in stock
                              </p>
                            </div>
                            <span className="font-bold text-neutral-900 font-mono">
                              {formatMoney(p.revenue, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-neutral-900">
                      Customer Orders Ledger
                    </h3>
                    <span className="text-xs text-neutral-500">
                      Real-time webhook and gateway status synchronization
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                        <tr>
                          <th className="py-3 px-4">Order Ref</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Gateway</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-neutral-50/60">
                            <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                              {o.orderNumber}
                              <p className="text-[10px] text-neutral-400 font-normal font-sans">
                                {new Date(o.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-neutral-900">{o.customerName}</p>
                              <p className="text-[11px] text-neutral-500">{o.customerEmail}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  o.paymentGateway === 'stripe'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-sky-50 text-sky-700'
                                }`}
                              >
                                {o.paymentGateway}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold font-mono text-neutral-900">
                              {formatMoney(o.totalAmount, currency)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  o.orderStatus === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.orderStatus === 'shipped'
                                    ? 'bg-sky-100 text-sky-800'
                                    : o.orderStatus === 'refunded'
                                    ? 'bg-amber-100 text-amber-800'
                                    : o.orderStatus === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5">
                              {/* Status change actions */}
                              {o.orderStatus === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'shipped')}
                                  className="px-2.5 py-1 rounded bg-neutral-900 text-white text-[11px] font-semibold hover:bg-neutral-800"
                                >
                                  Mark Shipped
                                </button>
                              )}
                              {o.orderStatus === 'shipped' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                                  className="px-2.5 py-1 rounded bg-emerald-700 text-white text-[11px] font-semibold hover:bg-emerald-800"
                                >
                                  Mark Delivered
                                </button>
                              )}
                              {o.orderStatus !== 'refunded' && o.orderStatus !== 'cancelled' && (
                                <button
                                  onClick={() => setRefundOrderId(o.id)}
                                  className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold"
                                >
                                  Refund
                                </button>
                              )}
                              <button
                                onClick={() => onOpenInvoice(o)}
                                className="px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-[11px]"
                                title="Print Packing Slip / Invoice"
                              >
                                <Printer className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCTS & INVENTORY */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-neutral-900">
                        Product Catalog &amp; Live Stock Levels
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Inventory auto-decrements on payment and restores on refund/cancellation.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                        <tr>
                          <th className="py-3 px-4">Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Base Price</th>
                          <th className="py-3 px-4">Variants</th>
                          <th className="py-3 px-4">Inventory Available</th>
                          <th className="py-3 px-4">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-50/60">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={p.images[0]}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover border"
                                />
                                <div className="truncate max-w-xs">
                                  <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                                  <p className="text-[11px] text-neutral-400 truncate">{p.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-neutral-600">{p.category}</td>
                            <td className="py-3 px-4 font-bold font-mono text-neutral-900">
                              {formatMoney(p.basePrice, currency)}
                            </td>
                            <td className="py-3 px-4 text-neutral-500">{p.variants.length} options</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  p.totalStock <= 5
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {p.totalStock} units
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-neutral-800">
                              ★ {p.rating} ({p.reviewCount})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: DISCOUNTS & COUPONS */}
              {activeTab === 'discounts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-neutral-900">
                        Promotions &amp; Coupon Codes
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Real-time server validation with min-order thresholds.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddDiscount(true)}
                      className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Coupon</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {discounts.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3 shadow-sm relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm tracking-wide text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg">
                            {d.code}
                          </span>
                          <button
                            onClick={() => handleDeleteDiscount(d.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                            aria-label="Delete discount"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-600 font-medium">{d.description}</p>

                        <div className="text-[11px] text-neutral-500 space-y-0.5 border-t border-neutral-100 pt-2">
                          <p>
                            Discount:{' '}
                            <strong>{d.type === 'percentage' ? `${d.value}% Off` : `$${d.value} Flat Off`}</strong>
                          </p>
                          <p>Min Order: ${d.minOrderValue}</p>
                          <p>Total Redemptions: {d.currentUses} times</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create Coupon Modal Form */}
                  {showAddDiscount && (
                    <form
                      onSubmit={handleCreateDiscount}
                      className="p-5 rounded-2xl border border-neutral-300 bg-white space-y-4 max-w-lg mx-auto shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-neutral-900">New Discount Rule</h4>
                        <button
                          type="button"
                          onClick={() => setShowAddDiscount(false)}
                          className="text-neutral-400 hover:text-neutral-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Coupon Code
                          </label>
                          <input
                            type="text"
                            required
                            value={newDiscCode}
                            onChange={(e) => setNewDiscCode(e.target.value.toUpperCase())}
                            placeholder="e.g. FLASH30"
                            className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Discount Type
                          </label>
                          <select
                            value={newDiscType}
                            onChange={(e) => setNewDiscType(e.target.value as any)}
                            className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 bg-white"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Dollar Amount ($)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Value {newDiscType === 'percentage' ? '(%)' : '($)'}
                          </label>
                          <input
                            type="number"
                            required
                            value={newDiscVal}
                            onChange={(e) => setNewDiscVal(Number(e.target.value))}
                            className="w-full text-xs p-2.5 rounded-xl border border-neutral-300"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Min Order Value ($)
                          </label>
                          <input
                            type="number"
                            required
                            value={newDiscMin}
                            onChange={(e) => setNewDiscMin(Number(e.target.value))}
                            className="w-full text-xs p-2.5 rounded-xl border border-neutral-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          required
                          value={newDiscDesc}
                          onChange={(e) => setNewDiscDesc(e.target.value)}
                          placeholder="e.g. 20% off site-wide on orders over $100"
                          className="w-full text-xs p-2.5 rounded-xl border border-neutral-300"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
                      >
                        Publish Discount Code
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 5: WEBHOOKS & IDEMPOTENCY SIMULATOR */}
              {activeTab === 'webhooks' && (
                <div className="space-y-6">
                  {/* Upwork Client Demonstration Box */}
                  <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-4 shadow-lg border border-neutral-800">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Zap className="w-4 h-4" />
                      <h4 className="font-display font-bold text-sm text-white">
                        Interactive Webhook &amp; Idempotency Simulator
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-300 max-w-2xl">
                      Demonstrate to clients that asynchronous webhooks from Stripe and Razorpay update order status and decrements inventory idempotently. If a gateway retries the same webhook twice, the idempotency guard detects it and prevents duplicate orders.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Gateway</label>
                        <select
                          value={simGateway}
                          onChange={(e) => setSimGateway(e.target.value as any)}
                          className="w-full text-xs p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                        >
                          <option value="stripe">Stripe</option>
                          <option value="razorpay">Razorpay</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Event Type</label>
                        <select
                          value={simEvent}
                          onChange={(e) => setSimEvent(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono"
                        >
                          <option value="payment_intent.succeeded">payment_intent.succeeded</option>
                          <option value="charge.refunded">charge.refunded</option>
                          <option value="payment_intent.payment_failed">payment_intent.payment_failed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Target Order</label>
                        <select
                          value={simOrderId}
                          onChange={(e) => setSimOrderId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono"
                        >
                          {orders.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.orderNumber} ({o.orderStatus})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={simIsDuplicate}
                            onChange={(e) => setSimIsDuplicate(e.target.checked)}
                            className="rounded"
                          />
                          <span>Simulate Duplicate Retry</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleSimulateWebhook}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs shadow-md transition-colors"
                        >
                          Fire Webhook Event
                        </button>
                      </div>
                    </div>

                    {simResult && (
                      <div className="p-3 bg-neutral-800/80 border border-neutral-700 rounded-xl text-xs font-mono">
                        {simResult}
                      </div>
                    )}
                  </div>

                  {/* Webhook Log Table */}
                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-neutral-50 border-b border-neutral-200 font-bold text-xs text-neutral-800">
                      Recent Inbound Webhook Records
                    </div>
                    <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
                      {webhookLogs.map((log) => (
                        <div key={log.id} className="p-3.5 text-xs flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-neutral-900">{log.eventType}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.status === 'processed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {log.status}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                via {log.gateway}
                              </span>
                            </div>
                            <p className="text-neutral-500 mt-1 font-mono text-[11px] truncate max-w-xl">
                              {log.payloadSummary}
                            </p>
                          </div>
                          <span className="text-[11px] text-neutral-400 shrink-0">
                            {new Date(log.receivedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: EMAIL OUTBOX & ABANDONED CART */}
              {activeTab === 'emails' && (
                <div className="space-y-6">
                  {/* Abandoned Cart Trigger Box */}
                  <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="font-display font-bold text-sm text-neutral-900">
                        Trigger Abandoned Cart Sequence
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Automatically recovers drop-offs by emailing customers with saved discount incentives.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={abandonedCartEmail}
                        onChange={(e) => setAbandonedCartEmail(e.target.value)}
                        className="text-xs p-2.5 rounded-xl border border-neutral-300 w-56"
                      />
                      <button
                        onClick={handleSendRecoveryEmail}
                        className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Recovery</span>
                      </button>
                    </div>
                  </div>

                  {recoverySentNotice && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium">
                      Abandoned cart recovery email dispatched to {abandonedCartEmail}! Check ledger below.
                    </div>
                  )}

                  {/* Emails List */}
                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-neutral-50 border-b border-neutral-200 font-bold text-xs text-neutral-800">
                      Dispatched Transactional Emails
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {emails.map((em) => (
                        <div key={em.id} className="p-4 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900">{em.subject}</span>
                            <span className="text-[11px] text-neutral-400">
                              {new Date(em.sentAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-neutral-500">
                            Recipient: <strong className="text-neutral-700">{em.to}</strong> &bull; Type: {em.type}
                          </p>
                          <div
                            className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-700 mt-2 text-[11px]"
                            dangerouslySetInnerHTML={{ __html: em.htmlBody }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200 font-bold text-xs text-neutral-800">
                    System Security &amp; Mutation Ledger
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 text-xs flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-neutral-900">{log.action}</span>
                            <span className="text-[10px] text-neutral-400">by {log.actor}</span>
                          </div>
                          <p className="text-neutral-600 mt-0.5">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Gateway Refund Confirmation Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border shadow-2xl">
            <h4 className="font-bold text-base text-neutral-900">
              Confirm Gateway API Refund
            </h4>
            <p className="text-xs text-neutral-500">
              This will trigger a real refund via the payment gateway API, restore the item inventory in the catalog, and notify the customer.
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Refund Reason
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-300"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRefundOrderId(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold text-neutral-600"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                disabled={isProcessingRefund}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isProcessingRefund ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
