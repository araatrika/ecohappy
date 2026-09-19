// Netlify Function: renders a branded, printable invoice/receipt as a standalone HTML page.
// Called by the client right after a Razorpay payment is verified (see src/pages/shop/[slug].astro).
//
// Deliberately NOT a security-critical document: the real payment record lives in Razorpay's own
// dashboard and in the "orders" Netlify Form submission (see BaseLayout.astro's hidden form).
// This is a customer-facing convenience -- a branded receipt they can save as a PDF via the
// browser's own print dialog, no PDF library / server-side rendering dependency required.
import products from './data/products.json' with { type: 'json' };
import site from './data/site.json' with { type: 'json' };

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function invoiceNumber(paymentId, date) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(paymentId || 'MANUAL').slice(-8).toUpperCase();
  return `EH-${stamp}-${suffix}`;
}

// Kept identical to the calculation in create-order.js so the invoice always shows what was
// actually charged, never a re-derived guess.
function shippingFor(amount) {
  const shipping = site.shipping;
  if (!shipping) return 0;
  if (typeof shipping.freeAbove === 'number' && amount > shipping.freeAbove) return 0;
  const tier = (shipping.tiers || []).find((t) => amount <= t.maxAmount);
  return tier ? tier.cost : 0;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const { slug, quantity, buyer, paymentId, orderId } = body || {};
  const qty = Math.max(1, Math.min(50, Number(quantity) || 1));
  const product = Array.isArray(products) ? products.find((p) => p.slug === slug) : null;

  if (!product) {
    return new Response('Unknown product', { status: 404 });
  }

  const unitPrice = typeof product.salePrice === 'number' && product.salePrice < product.price
    ? product.salePrice
    : product.price;
  const subtotal = unitPrice * qty;
  const shippingCost = shippingFor(subtotal);
  const total = subtotal + shippingCost;
  const date = new Date();
  const invNum = invoiceNumber(paymentId, date);
  const gstin = site.gstin || '';

  const buyerName = escapeHtml(buyer?.name);
  const buyerEmail = escapeHtml(buyer?.email);
  const buyerPhone = escapeHtml(buyer?.phone);
  const buyerAddress = [buyer?.address, buyer?.city, buyer?.pincode].filter(Boolean).map(escapeHtml).join(', ');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice ${escapeHtml(invNum)} -- Eco Happy</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  :root {
    --ink: #1E2B23; --white: #FFFFFF; --forest: #2F4739; --gold: #C98A2B;
    --cream: #F6F1E7; --gray-500: #6B6862; --gray-200: #E6E1D8;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Inter", system-ui, sans-serif; color: var(--ink);
    max-width: 720px; margin: 2.5rem auto; padding: 0 1.5rem; background: var(--white);
  }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid var(--forest); padding-bottom: 1.25rem; margin-bottom: 1.5rem; }
  .brand { font-family: Georgia, serif; font-size: 1.6rem; font-weight: 700; color: var(--forest); }
  .brand small { display: block; font-family: "Inter", system-ui, sans-serif; font-size: 0.75rem; font-weight: 400; color: var(--gray-500); margin-top: 0.2em; }
  .meta { text-align: right; font-size: 0.85rem; color: var(--gray-500); }
  .meta strong { color: var(--ink); font-size: 1rem; }
  .parties { display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; font-size: 0.9rem; }
  .parties h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-500); margin: 0 0 0.4em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
  th, td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--gray-200); font-size: 0.9rem; }
  th { background: var(--cream); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-500); }
  td.num, th.num { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 2rem; }
  .totals table { width: 260px; margin: 0; }
  .totals td { border: none; padding: 0.3rem 0.5rem; }
  .totals .grand td { font-weight: 700; font-size: 1.05rem; border-top: 2px solid var(--forest); padding-top: 0.6rem; }
  .note { font-size: 0.8rem; color: var(--gray-500); border-top: 1px solid var(--gray-200); padding-top: 1rem; }
  .actions { margin: 2rem 0 1rem; text-align: center; }
  .actions button {
    font: inherit; font-weight: 700; background: var(--forest); color: var(--white); border: none;
    border-radius: 8px; padding: 0.75em 1.6em; cursor: pointer;
  }
  @media print { .actions { display: none; } body { margin: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">Eco Happy<sup style="font-size:0.5em">&reg;</sup>
      <small>${escapeHtml(site.legalName)} &middot; ${escapeHtml(site.address?.addressLocality)}, ${escapeHtml(site.address?.addressRegion)} ${escapeHtml(site.address?.postalCode)}</small>
      <small>${escapeHtml(site.email)} &middot; ${escapeHtml(site.telephone)}</small>
    </div>
    <div class="meta">
      <strong>Invoice ${escapeHtml(invNum)}</strong><br />
      ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br />
      ${gstin ? `GSTIN: ${escapeHtml(gstin)}` : 'GSTIN: not yet registered'}
    </div>
  </div>

  <div class="parties">
    <div>
      <h3>Billed to</h3>
      ${buyerName || '&mdash;'}<br />
      ${buyerAddress || ''}<br />
      ${buyerEmail}${buyerEmail && buyerPhone ? ' &middot; ' : ''}${buyerPhone}
    </div>
    <div>
      <h3>Payment reference</h3>
      Order: ${escapeHtml(orderId) || '&mdash;'}<br />
      Payment: ${escapeHtml(paymentId) || '&mdash;'}
    </div>
  </div>

  <table>
    <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${escapeHtml(product.name)}${product.sku ? `<br><span style="color:var(--gray-500);font-size:0.8em">SKU: ${escapeHtml(product.sku)}</span>` : ''}</td>
        <td class="num">${qty}</td>
        <td class="num">&#8377;${unitPrice.toFixed(2)}</td>
        <td class="num">&#8377;${subtotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td class="num">&#8377;${subtotal.toFixed(2)}</td></tr>
      <tr><td>Shipping${shippingCost === 0 ? ' (free)' : ''}</td><td class="num">&#8377;${shippingCost.toFixed(2)}</td></tr>
      <tr class="grand"><td>Total paid</td><td class="num">&#8377;${total.toFixed(2)}</td></tr>
    </table>
  </div>

  <p class="note">
    ${gstin
      ? 'This is a GST invoice issued under the GSTIN shown above.'
      : "This is a receipt, not a GST tax invoice -- Eco Happy's GST registration is in progress. A formal GST invoice will be issued once available, on request."}
    Prices are inclusive of all taxes where applicable. For questions about this order, reply to
    ${escapeHtml(site.email)} or message us on WhatsApp with this invoice number.
  </p>

  <div class="actions">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};
