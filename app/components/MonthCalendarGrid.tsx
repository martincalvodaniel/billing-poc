"use client"

import { type PointerEvent, type ReactNode, useRef } from "react"

const DEFAULT_WEEKDAY_HEADERS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const

interface MonthCalendarGridProps<TCell extends { key: string }> {
  cells: readonly TCell[]
  renderCell: (cell: TCell) => ReactNode
  weekdayHeaders?: readonly string[]
  onSwipeToPreviousMonth?: () => void
  onSwipeToNextMonth?: () => void
}

const SWIPE_THRESHOLD_PX = 48

export default function MonthCalendarGrid<TCell extends { key: string }>({
  cells,
  renderCell,
  weekdayHeaders = DEFAULT_WEEKDAY_HEADERS,
  onSwipeToPreviousMonth,
  onSwipeToNextMonth,
}: MonthCalendarGridProps<TCell>) {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)

  const isSwipeEnabled = !!onSwipeToPreviousMonth || !!onSwipeToNextMonth

  const clearDragState = () => {
    dragStartRef.current = null
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isSwipeEnabled) return
    if (event.pointerType === "mouse" && event.button !== 0) return
    dragStartRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isSwipeEnabled) return
    const start = dragStartRef.current
    if (!start) return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < SWIPE_THRESHOLD_PX || absX <= absY) return

    if (deltaX > 0) {
      onSwipeToPreviousMonth?.()
    } else {
      onSwipeToNextMonth?.()
    }
    suppressClickRef.current = true
    clearDragState()
  }

  const handleClickCapture = (event: PointerEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className="touch-pan-y rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearDragState}
      onPointerCancel={clearDragState}
      onPointerLeave={clearDragState}
      onClickCapture={handleClickCapture}
    >
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayHeaders.map((label) => (
          <div
            key={label}
            className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => renderCell(cell))}
      </div>
    </div>
  )
}
