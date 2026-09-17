// Exports a minimal, price-authoritative products list from the content collection markdown
// into netlify/functions/data/products.json, so the create-order function always charges what
// the site actually shows — never a client-supplied price. Runs automatically before every build.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from 'yaml';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, '..', 'src', 'content', 'products');
const outDir = path.join(__dirname, '..', 'netlify', 'functions', 'data');
const outFile = path.join(outDir, 'products.json');

const files = readdirSync(productsDir).filter((f) => f.endsWith('.md'));
const products = files.map((file) => {
  const raw = readFileSync(path.join(productsDir, file), 'utf-8');
  const fm = raw.split('---')[1];
  const data = parse(fm);
  return {
    slug: data.slug,
    name: data.name,
    sku: data.sku || '',
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
