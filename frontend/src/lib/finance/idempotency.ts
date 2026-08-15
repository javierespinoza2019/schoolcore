/** Stable idempotency key for a payment attempt (regenerate when charge changes). */
export function newPaymentIdempotencyKey(chargeId: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `pay-${chargeId}-${uuid}`;
}
