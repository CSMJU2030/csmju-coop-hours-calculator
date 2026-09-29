import { NextResponse } from 'next/server';

/**
 * CSMJU2030 API convention (docs/api-conventions.md):
 *  - success: { success: true, data[, meta] } — no other top-level keys
 *  - error:   { success: false, error: { code, message, details } }
 *             `code` must come from the closed enum in
 *             contracts/error-codes.json — inventing new codes is not allowed.
 */
export function envelope<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// status -> contract error code (contracts/error-codes.json httpMapping, reversed)
const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Signature kept the same as before (message, status) on purpose so every
 * existing call site keeps working — the status -> error.code mapping now
 * happens here instead of being the caller's problem. Pass `details` (array
 * of strings) for VALIDATION_ERROR per the contract's `meaning` field.
 */
export function envelopeError(message: string, status = 400, details?: string[]) {
  const code = STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';
  return NextResponse.json(
    { success: false, error: { code, message, details: details ?? null } },
    { status },
  );
}