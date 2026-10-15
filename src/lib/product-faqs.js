// Builds the FAQ list for a product page from facts already on the product -- never invented
// copy. Lives here rather than inside shop/[slug].astro because that page also needs to build
// every other product's FAQs, to work out which answers are site-wide boilerplate and keep
// those out of the FAQPage schema (see schemaFaqs there).
//
// Each item is { topic, q, a, more? }. `more` is a link to the page that owns the canonical
// answer, so a generic reply points at the policy instead of restating it on 40+ pages.

export function shippingFor(amount, site) {
  const shipping = site.shipping;
  if (!shipping) return 0;
  if (typeof shipping.freeAbove === 'number' && amount > shipping.freeAbove) return 0;
  const tier = (shipping.tiers || []).find((t) => amount <= t.maxAmount);
  return tier ? tier.cost : 0;
}

export const inr = (n) =>
  '₹' +
  n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

// Canonical answers that already exist on the site, linked instead of duplicated.
const SHIPPING_COST_ANSWER = '/faq/#how-much-does-shipping-cost';
const DELIVERY_TIME_ANSWER = '/faq/#how-long-does-delivery-take';
const BULK_ANSWER = '/faq/#can-i-customise-products-for-a-bulk-or-corporate-order';
const RETURNS_POLICY = '/shipping-and-returns/';

export function buildProductFaqs(p, site) {
  const onSale = typeof p.salePrice === 'number' && p.salePrice < p.price;
  const effectivePrice = onSale ? p.salePrice : p.price;
  const shippingCost = shippingFor(effectivePrice, site);
  const deliveryEstimate = site.shipping?.deliveryEstimate || '5-7 business days across India';

  const generated = [
    p.specs?.material && {
      topic: 'material',
      q: `What is ${p.name} made of?`,
      a: `${p.name} is made of ${String(p.specs.material).replace(/\.$/, '')}.${
        p.specs.seeds ? ` The seeds included are ${String(p.specs.seeds).replace(/\.$/, '')}.` : ''
      }`,
    },
    {
      topic: 'shipping',
      q: `How much is shipping on ${p.name}?`,
      a:
        shippingCost > 0
          ? `Shipping is ${inr(shippingCost)} on this product${
              typeof site.shipping?.freeAbove === 'number'
                ? `, and free on orders above ${inr(site.shipping.freeAbove)}`
                : ''
            }.`
          : `Shipping is free on ${p.name}.`,
      more: { href: SHIPPING_COST_ANSWER, label: 'How shipping is charged' },
    },
    {
      topic: 'dispatch',
      q: `How soon will ${p.name} be dispatched?`,
      a:
        p.availability === 'InStock'
          ? `${p.name} ships from stock, usually dispatched within ${p.leadTimeDays} working days.`
          : `${p.name} is made to order, usually ready in about ${p.leadTimeDays} days after we confirm your order.`,
      more: { href: DELIVERY_TIME_ANSWER, label: `Delivery takes ${deliveryEstimate}` },
    },
    (p.bulk || p.customisable) && {
      topic: 'bulk',
      q: `Can I order ${p.name} in bulk${p.customisable ? ' or add our logo' : ''}?`,
      a: `Yes.${p.customisable ? ` ${p.name} can be customised with your logo or name.` : ''} Message us on WhatsApp at ${
        site.whatsapp?.enquiries || ''
      } with the quantity you need and we'll confirm pricing and lead time.`,
      more: { href: BULK_ANSWER, label: 'Bulk and customisation terms' },
    },
    {
      topic: 'returns',
      q: `Can I return ${p.name}?`,
      a: `Returns aren't accepted on this product, and damaged or incorrect items are put right if you contact us within 48 hours of delivery.`,
      more: { href: RETURNS_POLICY, label: 'Read the full returns policy' },
    },
  ].filter(Boolean);

  // Hand-written FAQs come first and suppress the generated question on the same topic.
  const manual = p.faq || [];
  const manualText = manual.map((f) => String(f.q).toLowerCase()).join(' | ');

  return [
    ...manual.map((f) => ({ topic: 'manual', q: f.q, a: f.a })),
    ...generated.filter(
      (g) =>
        !manualText.includes(g.topic) &&
        !manual.some((m) => String(m.q).toLowerCase().trim() === g.q.toLowerCase().trim())
    ),
  ];
}
