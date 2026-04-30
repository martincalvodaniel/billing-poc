"use client"

import { useCallback, useState } from "react"

interface UseToastResult {
  message: string | null
  show: (msg: string) => void
  clear: () => void
}

/**
 * Minimal toast state hook used by absence modals.
 *
 * NOTE: Preserves the iter1-12 behavior verbatim — a `setTimeout` is
 * scheduled on each `show()` call but is NOT cleared on unmount or on
 * a subsequent `show()`. This is a deliberate parity choice for iter13;
 * the latent missing-cleanup is documented but not fixed here.
 */
export default function useToast(durationMs: number = 4000): UseToastResult {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback(
    (msg: string) => {
      setMessage(msg)
      setTimeout(() => setMessage(null), durationMs)
    },
    [durationMs]
  )

  const clear = useCallback(() => {
    setMessage(null)
  }, [])

  return { message, show, clear }
}
