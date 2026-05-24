import { useMemo } from "react"
import type { Event } from "@/lib/domain/entities/event"
import {
  compareEventsChronologicalAsc,
  formatEventTimeAndTitle,
} from "../eventsUi"

interface EventDayCellProps {
  date: Date
  inMonth: boolean
  isToday: boolean
  events: Event[]
  ariaLabel: string
  onClick: () => void
  onEventClick: (event: Event) => void
}

const TITLE_PREVIEW_LIMIT = 2

export default function EventDayCell({
  date,
  inMonth,
  isToday,
  events,
  ariaLabel,
  onClick,
  onEventClick,
}: EventDayCellProps) {
  const dimmed = !inMonth
  const sortedEvents = useMemo(
    () => events.slice().sort(compareEventsChronologicalAsc),
    [events]
  )
  const count = sortedEvents.length
  const preview = sortedEvents.slice(0, TITLE_PREVIEW_LIMIT)
  const extra = Math.max(0, count - preview.length)

  return (
    // biome-ignore lint/a11y/useSemanticElements: keep chip buttons as descendants; rendering a <button> here would nest interactive elements.
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          if (event.key === " ") {
            event.preventDefault()
          }
          onClick()
        }
      }}
      className={`group relative flex min-h-24 cursor-pointer flex-col items-stretch gap-1 rounded-md border p-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
        isToday
          ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
      } ${
        dimmed
          ? "bg-zinc-50/60 text-zinc-400 dark:bg-zinc-900/60 dark:text-zinc-600"
          : "text-zinc-900 dark:text-zinc-100"
      }`}
    >
      <span
        className={`flex items-center justify-between text-xs font-semibold ${
          isToday ? "text-blue-600 dark:text-blue-400" : ""
        }`}
      >
        <span>{date.getDate()}</span>
        {count > 0 && (
          <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {count}
          </span>
        )}
      </span>
      <div className="mt-1 flex flex-1 flex-col gap-0.5">
        {preview.map((event) => {
          const eventTitle = formatEventTimeAndTitle(event)
          return (
            <button
              key={event._id ?? eventTitle}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEventClick(event)
              }}
              className="truncate rounded bg-purple-50 px-1.5 py-0.5 text-left text-[11px] font-medium text-purple-800 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-purple-950/40 dark:text-purple-200 dark:hover:bg-purple-900/60"
              title={eventTitle}
            >
              {eventTitle}
            </button>
          )
        })}
        {extra > 0 && (
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            +{extra} more
          </span>
        )}
      </div>
    </div>
  )
}
