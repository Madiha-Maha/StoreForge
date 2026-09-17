import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Printer,
  Mail,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CartItem,
  StoreConfig,
  CurrencyCode,
  Order,
  ShippingMethod,
  Address,
  Customer,
} from '../types';
import { formatMoney } from '../store.config';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: CurrencyCode;
  config: StoreConfig;
  appliedDiscount: { code: string; discountAmount: number; description: string } | null;
  customer: Customer;
  onOrderCreated: (order: Order) => void;
  onClearCart: () => void;
  onOpenInvoice: (order: Order) => void;
  onOpenEmailOutbox: () => void;
}

const SHIPPING_OPTIONS: ShippingMethod[] = [
  {
    id: 'ship_std',
    name: 'Standard Ground Delivery',
    price: 9.50,
    estimatedDays: '3–5 Business Days',
  },
  {
    id: 'ship_exp',
    name: 'Express Air Courier',
    price: 18.00,
    estimatedDays: '1–2 Business Days',
  },
  {
    id: 'ship_overnight',
    name: 'Priority Overnight',
    price: 32.00,
    estimatedDays: 'Next Day by 10:30 AM',
  },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  config,
  appliedDiscount,
  customer,
  onOrderCreated,
  onClearCart,
  onOpenInvoice,
  onOpenEmailOutbox,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'shipping' | 'delivery' | 'payment' | 'confirmed'>('shipping');

  // Address form fields
  const [fullName, setFullName] = useState(customer.name || 'Alex Morgan');
  const [email, setEmail] = useState(customer.email || 'alex@storeforge.dev');
  const [phone, setPhone] = useState(customer.phone || '+1 (415) 892-3100');
  const [street, setStreet] = useState('742 Market Street, Suite 400');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [state, setState] = useState('CA');
  const [postalCode, setPostalCode] = useState('94103');
  const [country, setCountry] = useState('United States');

  // Shipping
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>(SHIPPING_OPTIONS[0]);

  // Payment Selection: 'stripe' | 'razorpay' | 'cod'
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay' | 'cod'>(
    currency === 'INR' ? 'razorpay' : 'stripe'
  );

  // Stripe Card Details
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('424');
  const [cardHolder, setCardHolder] = useState('Alex Morgan');
  const [saveCard, setSaveCard] = useState(true);
  const [simulate3DS, setSimulate3DS] = useState(false);
  const [show3DSModal, setShow3DSModal] = useState(false);

  // Razorpay Details
  const [razorpayMethod, setRazorpayMethod] = useState<'upi' | 'netbanking' | 'cards'>('upi');
  const [upiVpa, setUpiVpa] = useState('success@razorpay');
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Order state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const estimatedTax = Math.round(taxableSubtotal * (config.taxRatePercent / 100) * 100) / 100;
  const isFreeShipEligible = subtotal >= (config.freeShippingThreshold || 100);
  const shippingCost = isFreeShipEligible && selectedShipping.id === 'ship_std' ? 0 : selectedShipping.price;
  const finalTotal = Math.round((taxableSubtotal + estimatedTax + shippingCost) * 100) / 100;

  // Auto fill demo helper
  const handleAutoFillAlex = () => {
    setFullName('Alex Morgan');
    setEmail('alex@storeforge.dev');
    setPhone('+1 (415) 892-3100');
    setStreet('742 Market Street, Suite 400');
    setCity('San Francisco');
    setState('CA');
    setPostalCode('94103');
    setCountry('United States');
  };

  const handleAutoFillRaj = () => {
    setFullName('Raj Verma');
    setEmail('raj.verma@example.in');
    setPhone('+91 98200 12345');
    setStreet('42 Indiranagar 100ft Road');
    setCity('Bengaluru');
    setState('Karnataka');
    setPostalCode('560038');
    setCountry('India');
    setPaymentGateway('razorpay');
    setUpiVpa('success@razorpay');
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    if (simulate3DS) {
      setShow3DSModal(true);
      setIsProcessing(false);
      return;
    }

    await executeStripeOrder();
  };

  const executeStripeOrder = async () => {
    setIsProcessing(true);
    try {
      // 1. Create PaymentIntent on server
      const intentRes = await fetch('/api/checkout/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((ci) => ({
            productId: ci.productId,
            productName: ci.product.name,
            quantity: ci.quantity,
            variantName: ci.variant?.name,
            sku: ci.variant?.sku || 'SKU-STD',
            unitPrice: ci.unitPrice,
          })),
          customerEmail: email,
          discountCode: appliedDiscount?.code,
          currency,
        }),
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentData.error || 'Failed to initialize payment');

      // 2. Simulate processing delay for realistic UX
      await new Promise((r) => setTimeout(r, 1200));

      // 3. Confirm payment with server
      const confirmRes = await fetch('/api/checkout/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: intentData.paymentIntentId,
          items: cartItems.map((ci) => ({
            productId: ci.productId,
            productName: ci.product.name,
            productImage: ci.product.images[0],
            quantity: ci.quantity,
            variantName: ci.variant?.name,
            sku: ci.variant?.sku || 'SKU-STD',
            unitPrice: ci.unitPrice,
          })),
          customer: { id: customer.id, name: fullName, email },
          shippingAddress: {
            fullName,
            email,
            phone,
            street,
            apartment,
            city,
            state,
            postalCode,
            country,
          },
          shippingMethod: { ...selectedShipping, price: shippingCost },
          discountCode: appliedDiscount?.code,
          currency,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to confirm order');

      // Order success!
      setConfirmedOrder(confirmData.order);
      onOrderCreated(confirmData.order);
      onClearCart();
      setStep('confirmed');

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setShow3DSModal(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create Razorpay order on server
      const orderRes = await fetch('/api/checkout/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((ci) => ({
            productId: ci.productId,
            quantity: ci.quantity,
            variantName: ci.variant?.name,
            sku: ci.variant?.sku || 'SKU-RZP',
          })),
          customerEmail: email,
          discountCode: appliedDiscount?.code,
          currency: 'INR',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create Razorpay order');

      // 2. Simulate payment verification
      await new Promise((r) => setTimeout(r, 1500));

      const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const verifyRes = await fetch('/api/checkout/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderData.razorpayOrderId,
          razorpaySignature: 'simulated_valid_signature_2026',
          items: cartItems.map((ci) => ({
            productId: ci.productId,
            productName: ci.product.name,
            productImage: ci.product.images[0],
            quantity: ci.quantity,
            variantName: ci.variant?.name,
            sku: ci.variant?.sku || 'SKU-RZP',
            unitPrice: ci.unitPrice,
          })),
          customer: { id: customer.id, name: fullName, email },
          shippingAddress: {
            fullName,
            email,
            phone,
            street,
            apartment,
            city,
            state,
            postalCode,
            country,
          },
          shippingMethod: selectedShipping,
          discountCode: appliedDiscount?.code,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Razorpay payment verification failed');

      setConfirmedOrder(verifyData.order);
      onOrderCreated(verifyData.order);
      onClearCart();
      setStep('confirmed');

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Razorpay processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyOrderNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderNumber(true);
    setTimeout(() => setCopiedOrderNumber(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: config.brandColor }}
            >
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-neutral-900 leading-tight">
                {step === 'confirmed' ? 'Order Confirmed' : 'Secure Encrypted Checkout'}
              </h2>
              <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PCI-DSS Level 1 Compliant • 256-Bit SSL</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Progress Tracker */}
        {step !== 'confirmed' && (
          <div className="px-6 py-3 border-b border-neutral-100 bg-white">
            <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-semibold">
              <button
                onClick={() => setStep('shipping')}
                className={`flex items-center gap-1.5 ${
                  step === 'shipping' ? 'text-neutral-900 font-bold' : 'text-neutral-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 'shipping'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  1
                </span>
                <span>Shipping</span>
              </button>

              <ChevronRight className="w-4 h-4 text-neutral-300" />

              <button
                onClick={() => setStep('delivery')}
                className={`flex items-center gap-1.5 ${
                  step === 'delivery' ? 'text-neutral-900 font-bold' : 'text-neutral-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 'delivery'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  2
                </span>
                <span>Delivery</span>
              </button>

              <ChevronRight className="w-4 h-4 text-neutral-300" />

              <button
                onClick={() => setStep('payment')}
                className={`flex items-center gap-1.5 ${
                  step === 'payment' ? 'text-neutral-900 font-bold' : 'text-neutral-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 'payment'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  3
                </span>
                <span>Payment</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="overflow-y-auto p-5 sm:p-8 flex-1">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 'shipping' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-lg text-neutral-900">
                    Contact &amp; Shipping Destination
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Enter customer details or auto-fill a test profile for instant evaluation.
                  </p>
                </div>

                {/* Quick Auto-Fill Buttons for testing */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillAlex}
                    className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
                  >
                    ⚡ Test Alex (US / Stripe)
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoFillRaj}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg transition-colors border border-amber-200"
                  >
                    ⚡ Test Raj (India / Razorpay)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="e.g. Alex Morgan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address (for order receipts) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="alex@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone Number (SMS delivery notifications)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="123 Main St, Apt 4B"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="San Francisco"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      ZIP / Postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                      placeholder="94103"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Country / Region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-neutral-900 focus:outline-none bg-white"
                  >
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName || !email || !street || !city || !postalCode) {
                      setErrorMessage('Please fill in all required shipping fields.');
                      return;
                    }
                    setErrorMessage('');
                    setStep('delivery');
                  }}
                  className="px-6 py-3 rounded-xl font-semibold text-xs text-white shadow-md hover:opacity-90 flex items-center gap-2"
                  style={{ backgroundColor: config.brandColor }}
                >
                  <span>Continue to Delivery Method</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING METHOD */}
          {step === 'delivery' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">
                  Select Shipping Speed
                </h3>
                <p className="text-xs text-neutral-500">
                  All shipments are fully insured with carbon-offset tracking.
                </p>
              </div>

              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((opt) => {
                  const isOptionFree = isFreeShipEligible && opt.id === 'ship_std';
                  const effectivePrice = isOptionFree ? 0 : opt.price;
                  const isSelected = selectedShipping.id === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedShipping(opt)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-neutral-900' : 'border-neutral-300'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-neutral-900">{opt.name}</p>
                          <p className="text-[11px] text-neutral-500">{opt.estimatedDays}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        {isOptionFree ? (
                          <span className="text-xs font-bold text-emerald-600">FREE</span>
                        ) : (
                          <span className="font-display font-bold text-xs text-neutral-900">
                            {formatMoney(effectivePrice, currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="px-4 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="px-6 py-3 rounded-xl font-semibold text-xs text-white shadow-md hover:opacity-90 flex items-center gap-2"
                  style={{ backgroundColor: config.brandColor }}
                >
                  <span>Continue to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY (STRIPE & RAZORPAY) */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">
                  Payment Method Selection
                </h3>
                <p className="text-xs text-neutral-500">
                  Select your gateway of choice. Supports cards, Apple Pay, UPI, Netbanking &amp; Wallets.
                </p>
              </div>

              {/* Gateway Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentGateway('stripe')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    paymentGateway === 'stripe'
                      ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-neutral-900">Stripe</span>
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Cards, Apple Pay, Google Pay, 3D Secure
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    International
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentGateway('razorpay')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    paymentGateway === 'razorpay'
                      ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-neutral-900">Razorpay</span>
                    <Smartphone className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    UPI, Netbanking, Paytm, Wallets
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    India &amp; Global
                  </span>
                </button>
              </div>

              {/* STRIPE PAYMENT PANEL */}
              {paymentGateway === 'stripe' && (
                <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-neutral-900" />
                      <span>Card Details (Stripe Elements Sandbox)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('4242 4242 4242 4242');
                        setCardExpiry('12/28');
                        setCardCvc('424');
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Fill Test Card 4242
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        placeholder="Name on card"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 pr-16"
                          placeholder="4242 4242 4242 4242"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                            VISA
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                          CVC / Security Code
                        </label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="rounded text-neutral-900 focus:ring-neutral-900"
                        />
                        <span>Save encrypted card token for 1-click reordering</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-indigo-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={simulate3DS}
                          onChange={(e) => setSimulate3DS(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-600"
                        />
                        <span>Test 3DS Challenge</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* RAZORPAY PAYMENT PANEL */}
              {paymentGateway === 'razorpay' && (
                <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setRazorpayMethod('upi')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        razorpayMethod === 'upi'
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      UPI (Google Pay / PhonePe)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRazorpayMethod('netbanking')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        razorpayMethod === 'netbanking'
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      Netbanking
                    </button>
                  </div>

                  {razorpayMethod === 'upi' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                          UPI ID / Virtual Payment Address (VPA)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiVpa}
                            onChange={(e) => setUpiVpa(e.target.value)}
                            className="flex-1 text-xs p-3 rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            placeholder="username@okhdfcbank"
                          />
                          <button
                            type="button"
                            onClick={() => setUpiVpa('success@razorpay')}
                            className="px-3 py-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold hover:bg-emerald-100"
                          >
                            Pass VPA
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Test handles: <code>success@razorpay</code> (approved) or <code>failure@razorpay</code> (declined).
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center gap-3">
                        <QrCode className="w-10 h-10 text-neutral-800 p-1 border rounded" />
                        <div className="text-xs">
                          <p className="font-semibold text-neutral-900">Scan &amp; Pay with Any UPI App</p>
                          <p className="text-neutral-500 text-[11px]">GPay, PhonePe, Paytm, BHIM</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-[11px] font-semibold text-neutral-600">
                        Choose Bank
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setSelectedBank(b)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left ${
                              selectedBank === b
                                ? 'border-neutral-900 bg-white shadow-sm'
                                : 'border-neutral-200 bg-white text-neutral-600'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary Line */}
              <div className="p-4 rounded-2xl bg-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500 block">Total Due Today</span>
                  <span className="font-display font-bold text-lg text-neutral-900">
                    {formatMoney(finalTotal, currency)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-neutral-500">
                  <span>Includes {formatMoney(estimatedTax, currency)} Tax</span>
                  <span className="block font-medium text-emerald-700">
                    {shippingCost === 0 ? 'Free Shipping Included' : `+${formatMoney(shippingCost, currency)} Shipping`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setStep('delivery')}
                  className="px-4 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={paymentGateway === 'stripe' ? handleStripePayment : handleRazorpayPayment}
                  disabled={isProcessing}
                  className="px-8 py-3.5 rounded-xl font-semibold text-sm text-white shadow-lg hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: config.brandColor }}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Authorize {paymentGateway === 'stripe' ? 'Stripe' : 'Razorpay'} &bull;{' '}
                        {formatMoney(finalTotal, currency)}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CONFIRMATION & INVOICE */}
          {step === 'confirmed' && confirmedOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                  Payment Captured Successfully
                </span>
                <h3 className="font-display font-bold text-2xl text-neutral-900">
                  Thank You For Your Order!
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  A confirmation email with tax invoice has been dispatched to{' '}
                  <strong className="text-neutral-900">{confirmedOrder.customerEmail}</strong>.
                </p>
              </div>

              {/* Order Number Card */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Order Reference Number
                  </span>
                  <span className="font-mono font-bold text-base text-neutral-900">
                    {confirmedOrder.orderNumber}
                  </span>
                </div>
                <button
                  onClick={() => copyOrderNumber(confirmedOrder.orderNumber)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-white flex items-center gap-1.5"
                >
                  {copiedOrderNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Items Breakdown */}
              <div className="max-w-md mx-auto rounded-2xl border border-neutral-200 overflow-hidden text-left text-xs divide-y divide-neutral-100">
                <div className="p-3 bg-neutral-50 font-bold text-neutral-700">
                  Ordered Items ({confirmedOrder.items.length})
                </div>
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center bg-white">
                    <div>
                      <p className="font-semibold text-neutral-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-[11px] text-neutral-400">{item.variantName}</p>
                      )}
                      <p className="text-[11px] text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-neutral-900">
                      {formatMoney(item.totalPrice, currency)}
                    </span>
                  </div>
                ))}
                <div className="p-3 bg-neutral-50/80 flex justify-between font-bold text-neutral-900 text-sm">
                  <span>Total Paid</span>
                  <span>{formatMoney(confirmedOrder.totalAmount, currency)}</span>
                </div>
              </div>

              {/* Post-order Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onOpenInvoice(confirmedOrder)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-bold hover:bg-neutral-50 flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print Invoice</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenEmailOutbox();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-bold hover:bg-neutral-50 flex items-center gap-2 shadow-sm"
                >
                  <Mail className="w-4 h-4 text-neutral-600" />
                  <span>Inspect Dispatched Email</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95"
                  style={{ backgroundColor: config.brandColor }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Secure Simulation Challenge Modal */}
      {show3DSModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-neutral-300 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-neutral-900">
                Stripe 3D Secure Verification
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Authenticating transaction of {formatMoney(finalTotal, currency)} with your card issuer.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl text-left text-xs space-y-1 font-mono border">
              <div>Merchant: {config.storeName}</div>
              <div>Amount: {formatMoney(finalTotal, currency)}</div>
              <div>Card ending: 4242</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShow3DSModal(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={executeStripeOrder}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Approve Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
