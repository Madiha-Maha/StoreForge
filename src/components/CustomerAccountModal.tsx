import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  MapPin,
  CreditCard,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Customer, Order, CurrencyCode, Address, CartItem, Product } from '../types';
import { formatMoney } from '../store.config';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  orders: Order[];
  currency: CurrencyCode;
  brandColor: string;
  onOpenInvoice: (order: Order) => void;
  onReorder: (order: Order) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders,
  currency,
  brandColor,
  onOpenInvoice,
  onReorder,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'cards'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const customerOrders = orders.filter(
    (o) => o.customerEmail.toLowerCase() === customer.email.toLowerCase()
  );

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'refunded':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-900">{customer.name}</h2>
              <p className="text-xs text-neutral-500">{customer.email} &bull; {customer.phone}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History ({customerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'addresses'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({customer.savedAddresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'cards'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Saved Cards ({customer.savedCards.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-neutral-800">No orders placed yet</p>
                  <p className="text-xs">Your completed purchases will appear here.</p>
                </div>
              ) : (
                customerOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:border-neutral-300 transition-all shadow-sm"
                    >
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer bg-neutral-50/50 hover:bg-neutral-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-neutral-900">
                                {order.orderNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(
                                  order.orderStatus
                                )}`}
                              >
                                {order.orderStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">
                              {new Date(order.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}{' '}
                              &bull; via {order.paymentGateway.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-display font-bold text-sm text-neutral-900">
                            {formatMoney(order.totalAmount, currency)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {isExpanded && (
                        <div className="p-4 border-t border-neutral-200 bg-white space-y-4 text-xs">
                          {/* Item List */}
                          <div className="space-y-2">
                            <span className="font-bold text-[11px] text-neutral-400 uppercase tracking-wider">
                              Items Ordered
                            </span>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-1 border-b border-neutral-100">
                                <div className="flex items-center gap-2.5">
                                  {item.productImage && (
                                    <img
                                      src={item.productImage}
                                      alt=""
                                      className="w-10 h-10 rounded-lg object-cover border"
                                    />
                                  )}
                                  <div>
                                    <p className="font-semibold text-neutral-900">{item.productName}</p>
                                    <p className="text-[11px] text-neutral-500">
                                      Qty: {item.quantity} {item.variantName ? `• ${item.variantName}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-semibold text-neutral-900">
                                  {formatMoney(item.totalPrice, currency)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Shipping Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-xl">
                            <div>
                              <p className="font-semibold text-neutral-700">Shipping Address:</p>
                              <p className="text-neutral-600">{order.shippingAddress.street}</p>
                              <p className="text-neutral-600">
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-700">Fulfillment Status:</p>
                              <p className="text-neutral-600">Method: {order.shippingMethod}</p>
                              {order.trackingNumber && (
                                <p className="text-indigo-600 font-medium">
                                  Tracking: {order.trackingNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              onClick={() => onOpenInvoice(order)}
                              className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Invoice</span>
                            </button>
                            <button
                              onClick={() => {
                                onReorder(order);
                                onClose();
                              }}
                              className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95"
                              style={{ backgroundColor: brandColor }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder All Items</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customer.savedAddresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">
                      {idx === 0 ? 'Primary Headquarters' : 'Residential Address'}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-neutral-800">{addr.fullName}</p>
                  <p className="text-neutral-600">{addr.street}</p>
                  <p className="text-neutral-600">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-neutral-600">{addr.country}</p>
                </div>
              ))}
            </div>
          )}

          {/* CARDS TAB */}
          {activeTab === 'cards' && (
            <div className="space-y-3">
              {customer.savedCards.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      {c.brand.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">
                        &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {c.last4}
                      </p>
                      <p className="text-neutral-400 text-[11px]">
                        Expires {c.expMonth}/{c.expYear}
                      </p>
                    </div>
                  </div>
                  {c.isDefault && (
                    <span className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
