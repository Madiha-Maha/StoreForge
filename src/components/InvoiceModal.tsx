import React from 'react';
import { X, Printer, Download, Sparkles, CheckCircle } from 'lucide-react';
import { Order, StoreConfig, CurrencyCode } from '../types';
import { formatMoney } from '../store.config';

interface InvoiceModalProps {
  order: Order | null;
  config: StoreConfig;
  currency: CurrencyCode;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  config,
  currency,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col my-auto">
        {/* Actions Bar (hidden during print) */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-neutral-900">
              Tax Invoice — {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors"
              aria-label="Close invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 sm:p-10 space-y-8 bg-white text-neutral-900">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: config.brandColor }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <h1 className="font-display text-xl font-extrabold tracking-tight">
                  {config.storeName}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{config.tagline}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{config.supportEmail} &bull; {config.supportPhone}</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Official Invoice
              </span>
              <p className="font-mono font-bold text-lg text-neutral-900">{order.orderNumber}</p>
              <p className="text-xs text-neutral-500">
                Date: {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Paid ({order.paymentGateway.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Billed / Shipped To:
              </span>
              <p className="font-bold text-neutral-900">{order.shippingAddress.fullName}</p>
              <p className="text-neutral-600">{order.shippingAddress.street}</p>
              <p className="text-neutral-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p className="text-neutral-600">{order.shippingAddress.country}</p>
              <p className="text-neutral-500 mt-1">{order.customerEmail}</p>
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Payment &amp; Fulfillment:
              </span>
              <p className="text-neutral-700">
                <strong>Gateway:</strong> {order.paymentGateway === 'stripe' ? 'Stripe Payments' : 'Razorpay UPI/Cards'}
              </p>
              <p className="text-neutral-700 truncate font-mono text-[11px]">
                <strong>Tx ID:</strong> {order.paymentTransactionId || 'N/A'}
              </p>
              <p className="text-neutral-700">
                <strong>Delivery:</strong> {order.shippingMethod}
              </p>
              {order.trackingNumber && (
                <p className="text-neutral-700">
                  <strong>Tracking:</strong> {order.trackingNumber}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-neutral-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-[11px] text-neutral-500">{item.variantName}</p>
                      )}
                      <p className="text-[10px] font-mono text-neutral-400">{item.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {formatMoney(item.unitPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-neutral-900">
                      {formatMoney(item.totalPrice, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">{formatMoney(order.subtotal, currency)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({order.discountCode || 'PROMO'})</span>
                  <span>-{formatMoney(order.discountAmount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? 'FREE' : formatMoney(order.shippingCost, currency)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Tax</span>
                <span>{formatMoney(order.taxAmount, currency)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total Paid</span>
                <span className="font-display text-base">{formatMoney(order.totalAmount, currency)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="pt-6 border-t border-neutral-200 text-center text-[11px] text-neutral-400">
            <p>Thank you for your business. For support inquiries or return assistance, email {config.supportEmail}.</p>
            <p className="mt-0.5">StoreForge • Verified E-Commerce Payment Architecture</p>
          </div>
        </div>
      </div>
    </div>
  );
};
