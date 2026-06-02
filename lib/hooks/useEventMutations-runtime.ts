import { FetchError } from "../swr-fetcher"
import type { BuiltRequest } from "./useEventMutations-types"

/**
 * Detects the 409 "cannot-modify-invoiced-payment" response from the
 * `PUT /api/events/[id]/attendees/[clientId]` endpoint and returns its
 * structured payload. Returns `null` for any other error shape.
 *
 * The server emits exactly:
 *   { error: "cannot-modify-invoiced-payment",
 *     paymentId: string,
 *     invoiceType: string,
 *     invoiceId: string }
 * with HTTP 409, wrapped here as `FetchError(status=409, info=<body>)`.
 */
export function isInvoiceGuardError(
  err: unknown
): { invoiceType: string; invoiceId: string; paymentId: string } | null {
  if (!(err instanceof FetchError)) return null
  if (err.status !== 409) return null
  const info = err.info
  if (!info || typeof info !== "object") return null
  const record = info as Record<string, unknown>
  if (record.error !== "cannot-modify-invoiced-payment") return null
  const { invoiceType, invoiceId, paymentId } = record
  if (typeof invoiceType !== "string") return null
  if (typeof invoiceId !== "string") return null
  if (typeof paymentId !== "string") return null
  return { invoiceType, invoiceId, paymentId }
}

export async function runRequest<TResponse>(
  req: BuiltRequest
): Promise<TResponse> {
  const init: RequestInit = {
    method: req.method,
    credentials: "same-origin",
    headers: req.body ? { "Content-Type": "application/json" } : undefined,
    body: req.body,
  }
  const response = await fetch(req.url, init)
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    let info: unknown
    if (contentType.includes("application/json")) {
      try {
        info = await response.json()
      } catch {
        info = null
      }
    } else {
      try {
        info = await response.text()
      } catch {
        info = null
      }
    }
    throw new FetchError(
      `${req.method} ${req.url} failed with status ${response.status}`,
      response.status,
      info
    )
  }
  return (await response.json()) as TResponse
}
