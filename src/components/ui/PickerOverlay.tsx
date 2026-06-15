"use client"

import { type ReactNode, useCallback } from "react"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import CloseButton from "./CloseButton"

interface PickerOverlayProps {
  children: ReactNode
  onClose: () => void
  closeLabel?: string
  width?: string
  className?: string
  desktopAlign?: "left" | "right"
}

export default function PickerOverlay({
  children,
  onClose,
  closeLabel = "Close",
  width = "w-72",
  className = "",
  desktopAlign = "right",
}: PickerOverlayProps) {
  const handleEscape = useCallback(() => {
    onClose()
  }, [onClose])
  useEscapeKey(handleEscape, true)
  const desktopAlignment =
    desktopAlign === "left"
      ? "sm:left-0 sm:right-auto"
      : "sm:left-auto sm:right-0"
  return (
    <div
      className={`fixed left-1/2 top-1/2 z-50 ${width} -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white shadow-lg sm:absolute ${desktopAlignment} sm:top-full sm:mt-2 sm:translate-x-0 sm:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900${className ? ` ${className}` : ""}`}
    >
      <div className="flex justify-end px-3 pt-2">
        <CloseButton onClick={onClose} label={closeLabel} />
      </div>
      {children}
    </div>
  )
}
