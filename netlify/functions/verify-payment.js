// Netlify Function: verifies a Razorpay payment's signature after checkout completes.
// Never trust "payment succeeded" from the client alone — always verify the HMAC signature
// server-side with the key secret before treating an order as paid.
import crypto from 'node:crypto';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return new Response(JSON.stringify({ error: 'Payments are not configured yet.' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return new Response(JSON.stringify({ error: 'Missing payment fields' }), { status: 400 });
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const valid = expected === razorpay_signature;

  if (!valid) {
    console.error('Razorpay signature mismatch', { razorpay_order_id, razorpay_payment_id });
    return new Response(JSON.stringify({ verified: false }), { status: 400 });
  }

  // TODO (post-launch): record the order (order id, payment id, product, amount, buyer contact)
  // somewhere durable — a Netlify Blob, a Google Sheet via API, or a simple database — so orders
  // aren't only visible in the Razorpay dashboard. Out of scope for the Sunday launch.
  return new Response(JSON.stringify({ verified: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
