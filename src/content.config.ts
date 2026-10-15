import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const image = z.object({ src: z.string(), alt: z.string().default(""), width: z.number().optional(), height: z.number().optional(), original: z.string().optional() });

// Dates written through /admin come out of Decap's datetime widget unquoted (datePublished:
// 2026-10-14), and js-yaml parses an unquoted YAML date as a Date object rather than a string.
// A bare z.string() therefore fails the whole build on any product added from the CMS, so
// accept either and normalise to YYYY-MM-DD.
const dateString = z
  .union([z.string(), z.date()])
  .transform((v) => (typeof v === "string" ? v.trim() : v.toISOString().slice(0, 10)));

const products = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
  schema: z.object({
    // Trimmed because a stray trailing space typed into /admin would otherwise end up in the
    // live URL (slug) or on the invoice (name). Kept in step with build-products-json.mjs, which
    // trims the same two fields so the server-side price lookup still matches the page's slug.
    name: z.string().trim(), slug: z.string().trim(), sku: z.string().trim().default(""),
    category: z.enum(["corporate-bulk-and-branding","festive-corporate-gifting","employee-welcome-kits","client-gift-hampers","everyday-desk-essentials","for-artists"]),
    categoryName: z.string(),
    price: z.number(), salePrice: z.number().optional(), currency: z.literal("INR").default("INR"),
    availability: z.enum(["InStock","OutOfStock","MadeToOrder","PreOrder"]).default("InStock"),
    stockQuantity: z.number().optional(), trackInventory: z.boolean().default(false), leadTimeDays: z.number().default(3),
    ribbon: z.string().default(""), bulk: z.boolean().default(false), customisable: z.boolean().default(false),
    options: z.array(z.object({ name: z.string().nullable(), type: z.string().nullable(), choices: z.array(z.string().nullable()) })).default([]),
    customTextFields: z.array(z.string()).default([]), variants: z.array(z.any()).default([]),
    images: z.array(image).default([]), wixCollections: z.array(z.string()).default([]),
    brand: z.string().default("Eco Happy"), seoTitle: z.string().default(""), seoDescription: z.string().default(""),
    answer: z.string().default(""), specs: z.record(z.any()).default({}),
    howToUse: z.array(z.string()).default([]), faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    related: z.array(z.string()).default([]), retired: z.boolean().default(false),
    datePublished: dateString, dateModified: dateString,
    migration: z.any().optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(), slug: z.string(), description: z.string().default(""), author: z.string().default("Jagruti Khabiya Jain"),
    datePublished: dateString, dateModified: dateString, cover: z.string().default(""), coverAlt: z.string().default(""),
    coverIsStock: z.boolean().default(false), tags: z.array(z.string()).default([]), timeToRead: z.string().default(""),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]), category: z.string().default("Sustainability & Greenwashing Guides"),
    draft: z.boolean().default(false), migration: z.any().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({ title: z.string(), slug: z.string(), newUrl: z.string().default(""), description: z.string().default(""),
    h1: z.array(z.string()).default([]), forms: z.array(z.array(z.string())).default([]), productsListed: z.array(z.string()).default([]), migration: z.any().optional() }),
});

export const collections = { products, guides, pages };
