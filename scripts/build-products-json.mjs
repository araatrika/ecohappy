// Exports a minimal, price-authoritative products list from the content collection markdown
// into netlify/functions/data/products.json, so the create-order and generate-invoice functions
// always charge/print what the site actually shows — never a client-supplied price. Also copies
// the handful of site.json fields the invoice needs (functions can't reliably import files
// outside their own directory tree once bundled). Runs automatically before every build.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from 'yaml';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, '..', 'src', 'content', 'products');
const outDir = path.join(__dirname, '..', 'netlify', 'functions', 'data');
const outFile = path.join(outDir, 'products.json');
const siteFile = path.join(__dirname, '..', 'src', 'data', 'site.json');
const siteOutFile = path.join(outDir, 'site.json');

const files = readdirSync(productsDir).filter((f) => f.endsWith('.md'));
const products = files.map((file) => {
  const raw = readFileSync(path.join(productsDir, file), 'utf-8');
  const fm = raw.split('---')[1];
  const data = parse(fm);
  return {
    // Trimmed to match src/content.config.ts, so this slug still matches the page's own slug
    // (a mismatch would make create-order's price lookup 404 on an otherwise fine product).
    slug: String(data.slug ?? '').trim(),
    name: String(data.name ?? '').trim(),
    sku: String(data.sku ?? '').trim(),
    price: data.price,
    salePrice: typeof data.salePrice === 'number' ? data.salePrice : null,
    currency: data.currency || 'INR',
    availability: data.availability || 'InStock',
    retired: !!data.retired,
  };
});

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(products, null, 2));
console.log(`Wrote ${products.length} products to ${path.relative(process.cwd(), outFile)}`);

const fullSite = JSON.parse(readFileSync(siteFile, 'utf-8'));
const siteForFunctions = {
  legalName: fullSite.legalName,
  gstin: fullSite.gstin,
  address: fullSite.address,
  email: fullSite.email,
  telephone: fullSite.telephone,
  shipping: fullSite.shipping,
};
writeFileSync(siteOutFile, JSON.stringify(siteForFunctions, null, 2));
console.log(`Wrote site fields to ${path.relative(process.cwd(), siteOutFile)}`);
