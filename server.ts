import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  Product,
  Order,
  DiscountCode,
  StoreConfig,
  WebhookLog,
  TransactionalEmail,
  AuditLog,
  Customer,
  AnalyticsData,
} from './src/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_DISCOUNTS,
  INITIAL_ORDERS,
  DEMO_CUSTOMER,
} from './src/data/seedData';
import { DEFAULT_STORE_CONFIG } from './src/store.config';

dotenv.config();

// In-Memory Database Store with initial seed
let products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
let orders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
let discounts: DiscountCode[] = JSON.parse(JSON.stringify(INITIAL_DISCOUNTS));
let storeConfig: StoreConfig = JSON.parse(JSON.stringify(DEFAULT_STORE_CONFIG));
let customers: Customer[] = [JSON.parse(JSON.stringify(DEMO_CUSTOMER))];
const webhookLogs: WebhookLog[] = [];
const processedWebhookEvents = new Set<string>();
const transactionalEmails: TransactionalEmail[] = [
  {
    id: 'em_init_10488',
    to: 'alex@storeforge.dev',
    subject: 'Order Confirmed: SF-10488',
    type: 'order_confirmation',
    orderNumber: 'SF-10488',
    sentAt: '2026-09-08T14:22:12.000Z',
    htmlBody: '<p>Thank you for your order! Your items are being prepared for dispatch.</p>',
  },
  {
    id: 'em_init_10489',
    to: 'alex@storeforge.dev',
    subject: 'Your order SF-10489 has shipped!',
    type: 'shipping_update',
    orderNumber: 'SF-10489',
    sentAt: '2026-09-15T11:45:00.000Z',
    htmlBody: '<p>Your order is on the way via FedEx Tracking: FEDEX-940010009382.</p>',
  },
];
const auditLogs: AuditLog[] = [
  {
    id: 'aud_1',
    timestamp: new Date().toISOString(),
    action: 'SYSTEM_BOOT',
    actor: 'System',
    details: 'StoreForge e-commerce engine initialized with seed catalog & gateways.',
    entityType: 'gateway',
  },
];

function logAudit(
  action: string,
  actor: string,
  details: string,
  entityType: 'order' | 'product' | 'discount' | 'gateway',
  entityId?: string
) {
  const entry: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
    entityType,
    entityId,
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 200) auditLogs.pop();
}

function sendTransactionalEmail(
  to: string,
  subject: string,
  type: TransactionalEmail['type'],
  orderNumber: string,
  htmlBody: string
) {
  const email: TransactionalEmail = {
    id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    to,
    subject,
    type,
    orderNumber,
    sentAt: new Date().toISOString(),
    htmlBody,
  };
  transactionalEmails.unshift(email);
  if (transactionalEmails.length > 100) transactionalEmails.pop();
  return email;
}

// Decrement stock for order items
function decrementStockForOrder(order: Order) {
  for (const item of order.items) {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      if (item.variantName) {
        const variant = prod.variants.find((v) => v.sku === item.sku || v.name === item.variantName);
        if (variant && variant.stock >= item.quantity) {
          variant.stock -= item.quantity;
        }
      }
      if (prod.totalStock >= item.quantity) {
        prod.totalStock -= item.quantity;
      }
    }
  }
}

// Restore stock for cancelled/refunded order items
function restoreStockForOrder(order: Order) {
  for (const item of order.items) {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      if (item.variantName) {
        const variant = prod.variants.find((v) => v.sku === item.sku || v.name === item.variantName);
        if (variant) {
          variant.stock += item.quantity;
        }
      }
      prod.totalStock += item.quantity;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing with raw body preservation for webhooks
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      store: storeConfig.storeName,
      time: new Date().toISOString(),
      gateways: {
        stripe: {
          enabled: storeConfig.stripeEnabled,
          configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...'),
        },
        razorpay: {
          enabled: storeConfig.razorpayEnabled,
          configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_...'),
        },
      },
    });
  });

  // Store Configuration
  app.get('/api/config', (_req, res) => {
    res.json(storeConfig);
  });

  app.post('/api/config', (req, res) => {
    storeConfig = { ...storeConfig, ...req.body };
    logAudit('CONFIG_UPDATED', 'Admin', `Store branding updated: ${storeConfig.storeName}`, 'gateway');
    res.json({ success: true, config: storeConfig });
  });

  // Products API
  app.get('/api/products', (req, res) => {
    let result = [...products];
    const { category, search, inStock, minPrice, maxPrice, sort } = req.query;

    if (category && typeof category === 'string' && category !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (inStock === 'true') {
      result = result.filter((p) => p.totalStock > 0);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      result = result.filter((p) => p.basePrice >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      result = result.filter((p) => p.basePrice <= Number(maxPrice));
    }

    if (sort) {
      if (sort === 'price_asc') result.sort((a, b) => a.basePrice - b.basePrice);
      else if (sort === 'price_desc') result.sort((a, b) => b.basePrice - a.basePrice);
      else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
      else if (sort === 'newest') result.reverse();
    }

    res.json(result);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = products.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });

  app.post('/api/products', (req, res) => {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      ...req.body,
    };
    products.unshift(newProduct);
    logAudit('PRODUCT_CREATED', 'Admin', `Created product: ${newProduct.name} ($${newProduct.basePrice})`, 'product', newProduct.id);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    products[index] = { ...products[index], ...req.body };
    logAudit('PRODUCT_UPDATED', 'Admin', `Updated product: ${products[index].name}`, 'product', req.params.id);
    res.json(products[index]);
  });

  app.delete('/api/products/:id', (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const deleted = products.splice(index, 1)[0];
    logAudit('PRODUCT_DELETED', 'Admin', `Deleted product: ${deleted.name}`, 'product', req.params.id);
    res.json({ success: true, deletedId: req.params.id });
  });

  // Discounts API
  app.get('/api/discounts', (_req, res) => {
    res.json(discounts);
  });

  app.post('/api/discounts/validate', (req, res) => {
    const { code, cartSubtotal } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Coupon code is required.' });
    }

    const discount = discounts.find(
      (d) => d.code.toUpperCase() === code.trim().toUpperCase() && d.isActive
    );

    if (!discount) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired discount code.' });
    }

    if (cartSubtotal < discount.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `Order subtotal must be at least $${discount.minOrderValue} to apply this code.`,
      });
    }

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round(((cartSubtotal * discount.value) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discount.value, cartSubtotal);
    }

    res.json({
      valid: true,
      code: discount.code,
      discountAmount,
      description: discount.description,
      type: discount.type,
      value: discount.value,
    });
  });

  app.post('/api/discounts', (req, res) => {
    const newDiscount: DiscountCode = {
      id: `disc_${Date.now()}`,
      currentUses: 0,
      isActive: true,
      ...req.body,
    };
    discounts.unshift(newDiscount);
    logAudit('DISCOUNT_CREATED', 'Admin', `Created discount code: ${newDiscount.code}`, 'discount', newDiscount.id);
    res.status(201).json(newDiscount);
  });

  app.delete('/api/discounts/:id', (req, res) => {
    const index = discounts.findIndex((d) => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Discount not found' });
    discounts.splice(index, 1);
    res.json({ success: true });
  });

  // ==========================================
  // PAYMENT GATEWAY INTEGRATIONS
  // ==========================================

  // Stripe: Create Payment Intent
  app.post('/api/checkout/stripe/create-intent', async (req, res) => {
    try {
      const { items, currency = 'usd', customerEmail, discountCode } = req.body;
      if (!items || !items.length) {
        return res.status(400).json({ error: 'No items in checkout payload.' });
      }

      // Calculate server-authoritative subtotal to prevent tampering
      let subtotal = 0;
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) continue;
        let unitPrice = prod.basePrice;
        if (item.variantName) {
          const v = prod.variants.find((v) => v.name === item.variantName || v.sku === item.sku);
          if (v) unitPrice += v.priceDelta;
        }
        subtotal += unitPrice * item.quantity;
      }

      let discountAmount = 0;
      if (discountCode) {
        const disc = discounts.find(
          (d) => d.code.toUpperCase() === discountCode.trim().toUpperCase() && d.isActive
        );
        if (disc && subtotal >= disc.minOrderValue) {
          discountAmount =
            disc.type === 'percentage'
              ? (subtotal * disc.value) / 100
              : Math.min(disc.value, subtotal);
        }
      }

      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxRate = (storeConfig.taxRatePercent || 8.5) / 100;
      const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
      const shippingCost = subtotal >= storeConfig.freeShippingThreshold ? 0 : 9.50;
      const totalAmount = Math.round((taxableAmount + taxAmount + shippingCost) * 100) / 100;

      // Real Stripe integration when key is provided, otherwise smart simulated intent
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      const isRealStripe = stripeSecret && stripeSecret.startsWith('sk_') && stripeSecret !== 'sk_test_...';

      let paymentIntentId = `pi_${crypto.randomBytes(12).toString('hex')}`;
      let clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(8).toString('hex')}`;

      if (isRealStripe) {
        try {
          // Dynamic import of Stripe if installed, or fallback gracefully
          const StripeModule = (await import('stripe')).default;
          const stripeClient = new StripeModule(stripeSecret, { apiVersion: '2023-10-16' as any });
          const intent = await stripeClient.paymentIntents.create({
            amount: Math.round(totalAmount * 100),
            currency: currency.toLowerCase(),
            receipt_email: customerEmail,
            metadata: {
              store: storeConfig.storeName,
              subtotal: subtotal.toFixed(2),
              discountAmount: discountAmount.toFixed(2),
            },
          });
          paymentIntentId = intent.id;
          clientSecret = intent.client_secret || clientSecret;
        } catch (err: any) {
          console.warn('Real Stripe call failed, falling back to sandbox intent:', err?.message);
        }
      }

      res.json({
        clientSecret,
        paymentIntentId,
        subtotal,
        discountAmount,
        taxAmount,
        shippingCost,
        totalAmount,
        currency: currency.toUpperCase(),
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_sample_storeforge_key',
        mode: isRealStripe ? 'live_test' : 'sandbox_simulator',
      });
    } catch (err: any) {
      console.error('Stripe create intent error:', err);
      res.status(500).json({ error: err?.message || 'Failed to create Stripe payment intent' });
    }
  });

  // Stripe: Confirm and Record Order
  app.post('/api/checkout/stripe/confirm', (req, res) => {
    try {
      const {
        paymentIntentId,
        items,
        customer,
        shippingAddress,
        billingAddress,
        shippingMethod,
        discountCode,
        currency = 'USD',
      } = req.body;

      if (!items || !items.length || !customer || !shippingAddress) {
        return res.status(400).json({ error: 'Missing required order fields.' });
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = items.map((item: any) => {
        const prod = products.find((p) => p.id === item.productId);
        let unitPrice = prod ? prod.basePrice : item.unitPrice;
        if (prod && item.variantName) {
          const v = prod.variants.find((v) => v.name === item.variantName || v.sku === item.sku);
          if (v) unitPrice += v.priceDelta;
        }
        const total = unitPrice * item.quantity;
        subtotal += total;
        return {
          productId: item.productId,
          productName: item.productName || (prod ? prod.name : 'Unknown Product'),
          productImage: item.productImage || (prod?.images[0] ?? ''),
          variantName: item.variantName,
          sku: item.sku || 'SKU-STD',
          quantity: item.quantity,
          unitPrice,
          totalPrice: total,
        };
      });

      let discountAmount = 0;
      if (discountCode) {
        const disc = discounts.find(
          (d) => d.code.toUpperCase() === discountCode.trim().toUpperCase() && d.isActive
        );
        if (disc && subtotal >= disc.minOrderValue) {
          discountAmount =
            disc.type === 'percentage'
              ? (subtotal * disc.value) / 100
              : Math.min(disc.value, subtotal);
          disc.currentUses += 1;
        }
      }

      const taxable = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(taxable * (storeConfig.taxRatePercent / 100) * 100) / 100;
      const shippingCost = shippingMethod?.price ?? (subtotal >= storeConfig.freeShippingThreshold ? 0 : 9.50);
      const totalAmount = Math.round((taxable + taxAmount + shippingCost) * 100) / 100;

      const orderNumber = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        orderNumber,
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name || shippingAddress.fullName,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        items: orderItems,
        subtotal,
        discountAmount,
        discountCode,
        shippingCost,
        shippingMethod: shippingMethod?.name || 'Standard Ground',
        taxAmount,
        totalAmount,
        currency: currency as any,
        currencySymbol: currency === 'INR' ? '₹' : '$',
        paymentGateway: 'stripe',
        paymentStatus: 'succeeded',
        orderStatus: 'confirmed',
        paymentTransactionId: paymentIntentId || `pi_${crypto.randomBytes(8).toString('hex')}`,
        idempotencyKey: `idem_stripe_${orderNumber}_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Decrement inventory automatically
      decrementStockForOrder(newOrder);

      orders.unshift(newOrder);

      // Dispatch order confirmation email
      sendTransactionalEmail(
        newOrder.customerEmail,
        `Order Confirmed: ${newOrder.orderNumber} — ${storeConfig.storeName}`,
        'order_confirmation',
        newOrder.orderNumber,
        `<p>Hi ${newOrder.customerName},</p><p>Thank you for shopping at ${storeConfig.storeName}. We have received payment of $${newOrder.totalAmount.toFixed(2)} via Stripe.</p>`
      );

      logAudit(
        'PAYMENT_SUCCESS_STRIPE',
        'Stripe Gateway',
        `Order ${newOrder.orderNumber} paid ($${newOrder.totalAmount}) via Stripe. Inventory updated.`,
        'order',
        newOrder.id
      );

      res.status(201).json({ success: true, order: newOrder });
    } catch (err: any) {
      console.error('Stripe confirm error:', err);
      res.status(500).json({ error: err?.message || 'Failed to confirm Stripe order' });
    }
  });

  // Razorpay: Create Order
  app.post('/api/checkout/razorpay/create-order', (req, res) => {
    try {
      const { items, currency = 'INR', customerEmail, discountCode } = req.body;
      if (!items || !items.length) {
        return res.status(400).json({ error: 'No items in cart.' });
      }

      let subtotal = 0;
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) continue;
        let unitPrice = prod.basePrice;
        if (item.variantName) {
          const v = prod.variants.find((v) => v.name === item.variantName || v.sku === item.sku);
          if (v) unitPrice += v.priceDelta;
        }
        subtotal += unitPrice * item.quantity;
      }

      let discountAmount = 0;
      if (discountCode) {
        const disc = discounts.find(
          (d) => d.code.toUpperCase() === discountCode.trim().toUpperCase() && d.isActive
        );
        if (disc && subtotal >= disc.minOrderValue) {
          discountAmount =
            disc.type === 'percentage'
              ? (subtotal * disc.value) / 100
              : Math.min(disc.value, subtotal);
        }
      }

      const taxable = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(taxable * 0.18 * 100) / 100; // 18% GST standard in India
      const shippingCost = subtotal >= storeConfig.freeShippingThreshold ? 0 : 150;
      const totalAmount = Math.round((taxable + taxAmount + shippingCost) * 100) / 100;

      const razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

      res.json({
        razorpayOrderId,
        amountInPaise: Math.round(totalAmount * 100),
        currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_storeforge_demo',
        subtotal,
        discountAmount,
        taxAmount,
        shippingCost,
        totalAmount,
      });
    } catch (err: any) {
      console.error('Razorpay create order error:', err);
      res.status(500).json({ error: err?.message || 'Failed to create Razorpay order' });
    }
  });

  // Razorpay: Verify Payment Signature and Create Order
  app.post('/api/checkout/razorpay/verify', (req, res) => {
    try {
      const {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        items,
        customer,
        shippingAddress,
        billingAddress,
        shippingMethod,
        discountCode,
      } = req.body;

      // Signature verification
      const secret = process.env.RAZORPAY_KEY_SECRET;
      let isValidSignature = true;

      if (secret && secret !== 'your_razorpay_secret') {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');
        isValidSignature = generatedSignature === razorpaySignature;
      }

      if (!isValidSignature) {
        logAudit(
          'RAZORPAY_SIGNATURE_FAILED',
          'Razorpay Gateway',
          `Tampered signature detected for order ${razorpayOrderId}`,
          'gateway'
        );
        return res.status(400).json({ error: 'Invalid Razorpay payment signature.' });
      }

      let subtotal = 0;
      const orderItems = items.map((item: any) => {
        const prod = products.find((p) => p.id === item.productId);
        let unitPrice = prod ? prod.basePrice : item.unitPrice;
        if (prod && item.variantName) {
          const v = prod.variants.find((v) => v.name === item.variantName || v.sku === item.sku);
          if (v) unitPrice += v.priceDelta;
        }
        const total = unitPrice * item.quantity;
        subtotal += total;
        return {
          productId: item.productId,
          productName: item.productName || prod?.name || 'Item',
          productImage: item.productImage || (prod?.images[0] ?? ''),
          variantName: item.variantName,
          sku: item.sku || 'SKU-RZP',
          quantity: item.quantity,
          unitPrice,
          totalPrice: total,
        };
      });

      let discountAmount = 0;
      if (discountCode) {
        const disc = discounts.find(
          (d) => d.code.toUpperCase() === discountCode.trim().toUpperCase() && d.isActive
        );
        if (disc && subtotal >= disc.minOrderValue) {
          discountAmount =
            disc.type === 'percentage'
              ? (subtotal * disc.value) / 100
              : Math.min(disc.value, subtotal);
          disc.currentUses += 1;
        }
      }

      const taxable = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(taxable * 0.18 * 100) / 100;
      const shippingCost = shippingMethod?.price ?? (subtotal >= storeConfig.freeShippingThreshold ? 0 : 150);
      const totalAmount = Math.round((taxable + taxAmount + shippingCost) * 100) / 100;

      const orderNumber = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        orderNumber,
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name || shippingAddress.fullName,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        items: orderItems,
        subtotal,
        discountAmount,
        discountCode,
        shippingCost,
        shippingMethod: shippingMethod?.name || 'Express Air Delivery',
        taxAmount,
        totalAmount,
        currency: 'INR',
        currencySymbol: '₹',
        paymentGateway: 'razorpay',
        paymentStatus: 'succeeded',
        orderStatus: 'confirmed',
        paymentTransactionId: razorpayPaymentId,
        idempotencyKey: `idem_rzp_${razorpayPaymentId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      decrementStockForOrder(newOrder);
      orders.unshift(newOrder);

      sendTransactionalEmail(
        newOrder.customerEmail,
        `Order Confirmed: ${newOrder.orderNumber} — ${storeConfig.storeName}`,
        'order_confirmation',
        newOrder.orderNumber,
        `<p>Namaste ${newOrder.customerName},</p><p>We have verified your Razorpay UPI/Card payment of ₹${newOrder.totalAmount}. Your order has been placed.</p>`
      );

      logAudit(
        'PAYMENT_SUCCESS_RAZORPAY',
        'Razorpay Gateway',
        `Order ${newOrder.orderNumber} confirmed via Razorpay (Payment ID: ${razorpayPaymentId}). Inventory decremented.`,
        'order',
        newOrder.id
      );

      res.status(201).json({ success: true, order: newOrder });
    } catch (err: any) {
      console.error('Razorpay verify error:', err);
      res.status(500).json({ error: err?.message || 'Failed to verify Razorpay order' });
    }
  });

  // ==========================================
  // WEBHOOKS & IDEMPOTENT PROCESSING
  // ==========================================

  // Stripe Webhook Receiver
  app.post('/api/webhooks/stripe', (req, res) => {
    const event = req.body;
    const eventId = event?.id || `evt_stripe_${Date.now()}`;
    const eventType = event?.type || 'unknown';

    // Idempotency check: Reject duplicate processing
    if (processedWebhookEvents.has(eventId)) {
      const logEntry: WebhookLog = {
        id: `wh_${Date.now()}`,
        gateway: 'stripe',
        eventType,
        eventId,
        status: 'duplicate_skipped',
        receivedAt: new Date().toISOString(),
        payloadSummary: `Duplicate event ${eventId} received. Skipped to prevent duplicate stock or status updates.`,
      };
      webhookLogs.unshift(logEntry);
      return res.status(200).json({ received: true, idempotent: true, note: 'Duplicate skipped' });
    }

    processedWebhookEvents.add(eventId);

    const logEntry: WebhookLog = {
      id: `wh_${Date.now()}`,
      gateway: 'stripe',
      eventType,
      eventId,
      status: 'processed',
      receivedAt: new Date().toISOString(),
      payloadSummary: JSON.stringify(event).substring(0, 160) + '...',
    };
    webhookLogs.unshift(logEntry);

    // Handle asynchronous payment events
    if (eventType === 'payment_intent.succeeded') {
      const pi = event.data?.object;
      const existingOrder = orders.find((o) => o.paymentTransactionId === pi?.id);
      if (existingOrder && existingOrder.orderStatus === 'placed') {
        existingOrder.orderStatus = 'confirmed';
        existingOrder.paymentStatus = 'succeeded';
        existingOrder.updatedAt = new Date().toISOString();
        decrementStockForOrder(existingOrder);
        logAudit('WEBHOOK_STRIPE_CONFIRMED', 'Stripe Webhook', `Order ${existingOrder.orderNumber} confirmed via webhook.`, 'order', existingOrder.id);
      }
    } else if (eventType === 'charge.refunded') {
      const charge = event.data?.object;
      const order = orders.find(
        (o) => o.paymentTransactionId === charge?.payment_intent || o.id === charge?.metadata?.orderId
      );
      if (order && order.orderStatus !== 'refunded') {
        order.orderStatus = 'refunded';
        order.paymentStatus = 'refunded';
        order.refundAmount = charge.amount_refunded ? charge.amount_refunded / 100 : order.totalAmount;
        order.updatedAt = new Date().toISOString();
        restoreStockForOrder(order);
        sendTransactionalEmail(
          order.customerEmail,
          `Refund Processed for ${order.orderNumber}`,
          'refund_receipt',
          order.orderNumber,
          `<p>A refund of $${order.refundAmount} has been returned to your original payment method.</p>`
        );
        logAudit('WEBHOOK_STRIPE_REFUNDED', 'Stripe Webhook', `Order ${order.orderNumber} marked refunded via webhook. Inventory restored.`, 'order', order.id);
      }
    }

    res.status(200).json({ received: true, status: 'processed' });
  });

  // Razorpay Webhook Receiver
  app.post('/api/webhooks/razorpay', (req, res) => {
    const event = req.body?.event || 'payment.captured';
    const eventId = req.body?.payload?.payment?.entity?.id || `evt_rzp_${Date.now()}`;

    if (processedWebhookEvents.has(eventId)) {
      webhookLogs.unshift({
        id: `wh_${Date.now()}`,
        gateway: 'razorpay',
        eventType: event,
        eventId,
        status: 'duplicate_skipped',
        receivedAt: new Date().toISOString(),
        payloadSummary: `Duplicate Razorpay event ${eventId} safely ignored.`,
      });
      return res.status(200).json({ received: true, idempotent: true });
    }

    processedWebhookEvents.add(eventId);

    webhookLogs.unshift({
      id: `wh_${Date.now()}`,
      gateway: 'razorpay',
      eventType: event,
      eventId,
      status: 'processed',
      receivedAt: new Date().toISOString(),
      payloadSummary: `Event ${event} for ${eventId}`,
    });

    res.status(200).json({ received: true });
  });

  // Webhook Simulator (Used by Admin Panel for client demonstrations)
  app.post('/api/webhooks/simulate', (req, res) => {
    const { gateway, eventType, orderId, isDuplicate } = req.body;
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    const eventId = isDuplicate ? 'evt_duplicate_test_key' : `evt_sim_${Date.now()}`;

    if (isDuplicate && processedWebhookEvents.has(eventId)) {
      webhookLogs.unshift({
        id: `wh_${Date.now()}`,
        gateway: gateway || 'stripe',
        eventType: eventType || 'payment_intent.succeeded',
        eventId,
        orderId: order?.id,
        status: 'duplicate_skipped',
        receivedAt: new Date().toISOString(),
        payloadSummary: `Idempotency Guard: Skipped duplicate simulated event ${eventId}.`,
      });
      return res.json({ success: true, result: 'duplicate_skipped', message: 'Duplicate event recognized and safely dropped without altering inventory.' });
    }

    processedWebhookEvents.add(eventId);

    if (order) {
      if (eventType === 'charge.refunded' || eventType === 'refund.processed') {
        order.orderStatus = 'refunded';
        order.paymentStatus = 'refunded';
        order.refundAmount = order.totalAmount;
        order.refundReason = 'Customer requested refund via webhook simulator';
        restoreStockForOrder(order);
        sendTransactionalEmail(
          order.customerEmail,
          `Refund Processed: ${order.orderNumber}`,
          'refund_receipt',
          order.orderNumber,
          `<p>Your refund of ${order.currencySymbol}${order.totalAmount} has been processed.</p>`
        );
      } else if (eventType === 'payment_intent.payment_failed') {
        order.paymentStatus = 'failed';
      }
    }

    webhookLogs.unshift({
      id: `wh_${Date.now()}`,
      gateway: gateway || 'stripe',
      eventType: eventType || 'payment_intent.succeeded',
      eventId,
      orderId: order?.id,
      status: 'processed',
      receivedAt: new Date().toISOString(),
      payloadSummary: `Simulated ${gateway} event ${eventType} executed successfully for order ${order?.orderNumber || 'N/A'}`,
    });

    logAudit(
      'WEBHOOK_SIMULATED',
      'Admin / Client Demo',
      `Fired simulated webhook: ${eventType} on ${gateway}`,
      'gateway'
    );

    res.json({
      success: true,
      result: 'processed',
      order,
    });
  });

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================

  app.get('/api/orders', (req, res) => {
    const { customerEmail, status } = req.query;
    let result = [...orders];

    if (customerEmail && typeof customerEmail === 'string') {
      result = result.filter((o) => o.customerEmail.toLowerCase() === customerEmail.toLowerCase());
    }

    if (status && typeof status === 'string' && status !== 'All') {
      result = result.filter((o) => o.orderStatus.toLowerCase() === status.toLowerCase());
    }

    res.json(result);
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  // Update order status (Admin)
  app.patch('/api/orders/:id/status', (req, res) => {
    const { status, trackingNumber } = req.body;
    const order = orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const prevStatus = order.orderStatus;
    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // If cancelled, return inventory
    if (status === 'cancelled' && prevStatus !== 'cancelled' && prevStatus !== 'refunded') {
      restoreStockForOrder(order);
    }

    // Customer email on status change
    if (status === 'shipped') {
      sendTransactionalEmail(
        order.customerEmail,
        `Your StoreForge order ${order.orderNumber} is on the way!`,
        'shipping_update',
        order.orderNumber,
        `<p>Great news! Your package has shipped. Tracking number: ${order.trackingNumber || 'SF-TRACK-8891'}.</p>`
      );
    }

    logAudit(
      'ORDER_STATUS_CHANGED',
      'Admin',
      `Order ${order.orderNumber} updated from ${prevStatus} to ${status}.`,
      'order',
      order.id
    );

    res.json(order);
  });

  // Process Refund via Gateway API
  app.post('/api/orders/:id/refund', (req, res) => {
    const { reason, amount } = req.body;
    const order = orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.orderStatus === 'refunded') {
      return res.status(400).json({ error: 'Order is already refunded.' });
    }

    const refundAmount = amount || order.totalAmount;
    order.orderStatus = 'refunded';
    order.paymentStatus = 'refunded';
    order.refundAmount = refundAmount;
    order.refundReason = reason || 'Customer requested return';
    order.updatedAt = new Date().toISOString();

    // Restore stock to catalog
    restoreStockForOrder(order);

    sendTransactionalEmail(
      order.customerEmail,
      `Refund Issued: ${order.orderNumber}`,
      'refund_receipt',
      order.orderNumber,
      `<p>We have processed a refund of ${order.currencySymbol}${refundAmount.toFixed(2)} through ${order.paymentGateway.toUpperCase()}. Reason: ${order.refundReason}</p>`
    );

    logAudit(
      'GATEWAY_REFUND_ISSUED',
      'Admin',
      `Issued gateway refund of ${order.currencySymbol}${refundAmount.toFixed(2)} for ${order.orderNumber} via ${order.paymentGateway}. Restored stock.`,
      'order',
      order.id
    );

    res.json({ success: true, order });
  });

  // ==========================================
  // ANALYTICS & AUDIT LOGS
  // ==========================================

  app.get('/api/analytics', (_req, res) => {
    const validOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
    const grossRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = validOrders.length;
    const averageOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    const lowStockItems = products
      .filter((p) => p.totalStock <= 5)
      .map((p) => ({ id: p.id, name: p.name, stock: p.totalStock }));

    const topProducts = products
      .map((p) => {
        const unitsSold = orders.reduce((sum, o) => {
          const item = o.items.find((i) => i.productId === p.id);
          return sum + (item ? item.quantity : 0);
        }, 0);
        return {
          id: p.id,
          name: p.name,
          unitsSold,
          revenue: unitsSold * p.basePrice,
          stockRemaining: p.totalStock,
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const analytics: AnalyticsData = {
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionFunnel: [
        { stage: 'Store Visits', count: 1840, rate: 100 },
        { stage: 'Product Viewed', count: 960, rate: 52.1 },
        { stage: 'Added to Cart', count: 420, rate: 22.8 },
        { stage: 'Reached Checkout', count: 195, rate: 10.6 },
        { stage: 'Payment Completed', count: totalOrders + 140, rate: 8.2 },
      ],
      revenueHistory: [
        { date: 'Sep 10', revenue: 640, orders: 3 },
        { date: 'Sep 11', revenue: 890, orders: 4 },
        { date: 'Sep 12', revenue: 1240, orders: 6 },
        { date: 'Sep 13', revenue: 780, orders: 3 },
        { date: 'Sep 14', revenue: 1420, orders: 7 },
        { date: 'Sep 15', revenue: 950, orders: 4 },
        { date: 'Sep 16', revenue: 1820, orders: 8 },
      ],
      topProducts,
      lowStockItems,
    };

    res.json(analytics);
  });

  app.get('/api/audit-logs', (_req, res) => {
    res.json(auditLogs);
  });

  app.get('/api/webhooks/logs', (_req, res) => {
    res.json(webhookLogs);
  });

  app.get('/api/emails', (_req, res) => {
    res.json(transactionalEmails);
  });

  app.post('/api/abandoned-carts/send-recovery', (req, res) => {
    const { email = 'shopper@example.com', cartValue = '$129.00' } = req.body;
    const sent = sendTransactionalEmail(
      email,
      `You left something in your bag at ${storeConfig.storeName}`,
      'abandoned_cart',
      'CART-REC',
      `<p>We saved your cart! Use code <strong>WELCOME15</strong> to take 15% off your order.</p>`
    );
    logAudit('ABANDONED_CART_DISPATCHED', 'Marketing Automation', `Sent cart recovery email to ${email}`, 'order');
    res.json({ success: true, email: sent });
  });

  // Reset database to seed
  app.post('/api/reset', (_req, res) => {
    products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    discounts = JSON.parse(JSON.stringify(INITIAL_DISCOUNTS));
    storeConfig = JSON.parse(JSON.stringify(DEFAULT_STORE_CONFIG));
    processedWebhookEvents.clear();
    logAudit('STORE_RESET', 'Admin', 'Store restored to default demo seed dataset.', 'gateway');
    res.json({ success: true, message: 'Store reset to fresh seed state.' });
  });

  // Customers
  app.get('/api/customers/me', (_req, res) => {
    res.json(customers[0]);
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoreForge Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
