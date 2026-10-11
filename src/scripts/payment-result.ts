// Hand-off between the Razorpay checkout on a product page and the payment result screens
// (/payment/success/ and /payment/failed/). It holds only what those screens display, in this
// tab's sessionStorage, which is cleared when the tab closes. Storage can be blocked or full,
// so every access is wrapped: if it fails, the screens still render, just without details.

export type PaymentOutcome = 'success' | 'failed' | 'cancelled' | 'unverified';

export interface InvoiceRequest {
  slug: string;
  quantity: number;
  buyer: Record<string, string>;
  paymentId: string;
  orderId: string;
}

export interface PaymentResult {
  outcome: PaymentOutcome;
  productName: string;
  productSlug: string;
  amountRupees?: number;
  orderId?: string;
  paymentId?: string;
  /** Razorpay's own description of a failed attempt, shown as given. */
  reason?: string;
  /** Present only after a verified payment; used by the invoice button on the success screen. */
  invoice?: InvoiceRequest;
}

const KEY = 'ecohappy:payment-result';

export function saveResult(result: PaymentResult): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // Storage blocked or full: the result screens fall back to their generic copy.
  }
}

export function readResult(): PaymentResult | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.outcome === 'string' ? (parsed as PaymentResult) : null;
  } catch {
    return null;
  }
}
