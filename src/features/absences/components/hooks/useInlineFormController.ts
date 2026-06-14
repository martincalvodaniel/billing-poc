"use client"

import { useEffect, useRef, useState } from "react"

interface UseInlineFormControllerResult {
  /** Whether the inline form is currently rendered. */
  visible: boolean
  /**
   * Show the form AND capture the current `document.activeElement` as
   * the focus-restoration target.
   */
  show: () => void
  /**
   * Capture the current `document.activeElement` without changing
   * visibility. Used by the edit-from-list flow where the form may
   * already be visible.
   */
  captureTrigger: () => void
  /**
   * Hide the form and (best-effort) restore focus to the previously
   * captured trigger. If the trigger is no longer in the DOM and a
   * `fallbackSelector` is provided, focus the first matching element.
   *
   * Uses `requestAnimationFrame` deliberately — DO NOT swap for
   * `setTimeout` or `useLayoutEffect`. Behavior preserved verbatim
   * from iter9.
   */
  hide: (fallbackSelector?: string) => void
  /** Container ref — pass to the wrapper that holds the inline form. */
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Owns the show/hide visibility, scroll-into-view + focus effect, and
 * focus restoration for the inline `<AbsenceForm>` rendered inside
 * `DayDetailModal`. Logic preserved byte-for-byte from iter9-12.
 */
export default function useInlineFormController(): UseInlineFormControllerResult {
  const [visible, setVisible] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  // When the form becomes visible, scroll it into view and focus the
  // student-name input as a best-effort accessibility nicety.
  useEffect(() => {
    if (!visible) return
    const container = containerRef.current
    if (!container) return
    container.scrollIntoView({ behavior: "smooth", block: "nearest" })
    const input = container.querySelector<HTMLInputElement>(
      'input[name="studentName"]'
    )
    input?.focus()
  }, [visible])

  const captureTrigger = () => {
    lastTriggerRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null
  }

  const show = () => {
    captureTrigger()
    setVisible(true)
  }

  const hide = (fallbackSelector?: string) => {
    setVisible(false)
    requestAnimationFrame(() => {
      const trigger = lastTriggerRef.current
      if (trigger?.isConnected) {
        trigger.focus()
        return
      }
      if (fallbackSelector) {
        const fallback =
          document.querySelector<HTMLButtonElement>(fallbackSelector)
        fallback?.focus()
      }
    })
  }

  return { visible, show, captureTrigger, hide, containerRef }
}
