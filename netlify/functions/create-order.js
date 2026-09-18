// Netlify Function: creates a Razorpay order for a single product purchase.
// Requires env vars RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (set in Netlify site settings —
// never commit real keys to the repo). Price is looked up server-side from the products
// content data so a tampered client request can't change what gets charged.
import Razorpay from 'razorpay';
import products from './data/products.json' with { type: 'json' };

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return new Response(
      JSON.stringify({ error: 'Payments are not configured yet — RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing.' }),
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { slug, quantity, buyer } = body || {};
  const qty = Math.max(1, Math.min(50, Number(quantity) || 1));
  // Buyer details are for the Razorpay order record and the branded invoice only -- they are
  // not trusted for pricing (looked up server-side below) and are truncated defensively since
  // Razorpay's `notes` field has a size limit.
  const safeBuyer = {
    name: String(buyer?.name || '').slice(0, 120),
    email: String(buyer?.email || '').slice(0, 120),
    phone: String(buyer?.phone || '').slice(0, 32),
  };
  const product = Array.isArray(products) ? products.find((p) => p.slug === slug) : null;

  if (!product || product.retired) {
    return new Response(JSON.stringify({ error: 'Unknown or unavailable product' }), { status: 404 });
  }

  const unitPrice = typeof product.salePrice === 'number' && product.salePrice < product.price
    ? product.salePrice
    : product.price;
  const amountPaise = Math.round(unitPrice * qty * 100);

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `${slug}-${Date.now()}`,
      notes: {
        slug,
        quantity: String(qty),
        sku: product.sku || '',
        buyerName: safeBuyer.name,
        buyerEmail: safeBuyer.email,
        buyerPhone: safeBuyer.phone,
      },
    });
    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        productName: product.name,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Razorpay order creation failed', err);
    return new Response(JSON.stringify({ error: 'Could not create order' }), { status: 502 });
  }
};
