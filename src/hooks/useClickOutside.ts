"use client"

import { type RefObject, useEffect } from "react"

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: PointerEvent) => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (ref.current && target && !ref.current.contains(target)) {
        handler(event)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [ref, handler, enabled])
}
