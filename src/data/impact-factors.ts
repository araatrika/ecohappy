// Emission factors and maths for /impact-calculator/.
//
// This module is the single source of truth: the page imports it in frontmatter to
// render real numbers at build time, and the client script imports the same file to
// recompute on input. Previously the constants were declared only inside the client
// <script>, so with JavaScript unavailable every figure on the page rendered "0" --
// a page whose stated premise is "no invented numbers" was publishing zeroes.
//
// Sources are documented in the Methodology section of the page itself; keep the two
// in step when changing a factor here.

export const PLASTIC_CO2_PER_KG = 2.5; // kg CO2e per kg plastic, cradle-to-gate
export const PEN_PLASTIC_G = 10; // typical ballpoint pen
export const PAPER_VIRGIN_CO2_PER_KG = 1.0;
export const PAPER_RECYCLED_CO2_PER_KG = 0.55;
export const NOTEBOOK_PAPER_G = 100; // typical A5 notebook

export const MIN_QTY = 0;
/** Above a million units this stops being an order and starts being a typo. */
export const MAX_QTY = 1_000_000;

export const DEFAULTS = { tool1: 500, tool2: 200, tool3: 100, tool4: 150 } as const;

/**
 * Coerce anything a number input can hand back into a usable quantity.
 * Covers "", "abc", "-5", "2.7", "1e999" (Infinity) and NaN.
 */
export function clampQty(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.floor(n)));
}

/**
 * Mass in kg, with precision that scales to the value. A flat
 * `maximumFractionDigits: 1` reported 0.01 kg as "0", so a single pencil showed
 * "0 kg plastic avoided" -- technically a rounding, practically a wrong answer.
 */
export function fmtMass(kg: number): string {
  if (!Number.isFinite(kg)) return '—';
  const abs = Math.abs(kg);
  const maximumFractionDigits = abs === 0 ? 0 : abs < 1 ? 2 : abs < 1000 ? 1 : 0;
  return kg.toLocaleString('en-IN', { maximumFractionDigits });
}

export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-IN');
}

export const penPlasticKg = (qty: number) => (qty * PEN_PLASTIC_G) / 1000;
export const penCo2Kg = (qty: number) => penPlasticKg(qty) * PLASTIC_CO2_PER_KG;
export const notebookPaperKg = (qty: number) => (qty * NOTEBOOK_PAPER_G) / 1000;
export const notebookCo2Kg = (qty: number) =>
  notebookPaperKg(qty) * (PAPER_VIRGIN_CO2_PER_KG - PAPER_RECYCLED_CO2_PER_KG);
export const hamperCo2Kg = (qty: number) => penCo2Kg(qty) + notebookCo2Kg(qty);
