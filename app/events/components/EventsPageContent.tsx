"use client"

import { useMemo, useState } from "react"
import PageLayout from "@/app/components/PageLayout"
import Toast from "@/app/components/Toast"
import MonthPicker from "@/app/month/components/MonthPicker"
import type { Event } from "@/lib/domain/entities/event"
import { formatMonthYear } from "@/lib/formatters"
import {
  useCreateEvent,
  useDeleteEvent,
  useGenerateEventPayments,
  useUpdateEvent,
} from "@/lib/hooks/useEventMutations"
import { useEvents } from "@/lib/hooks/useEvents"
import { FetchError } from "@/lib/swr-fetcher"
import DayEventsModal from "./DayEventsModal"
import EventDetailModal from "./EventDetailModal"
import EventFormModal, { type EventFormValues } from "./EventFormModal"
import EventsListTable from "./EventsListTable"
import EventsMonthCalendar from "./EventsMonthCalendar"

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function toRequiredNumber(value: string): number {
  const n = Number(value.trim())
  return Number.isFinite(n) ? n : 0
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    const info = error.info as { error?: string } | null
    if (info && typeof info.error === "string") return info.error
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

interface FormState {
  open: boolean
  mode: "create" | "edit"
  event?: Event
}

export default function EventsPageContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [formState, setFormState] = useState<FormState>({
    open: false,
    mode: "create",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [dayModalKey, setDayModalKey] = useState<string | null>(null)
  const [detailEventId, setDetailEventId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingGenerateAllId, setPendingGenerateAllId] = useState<
    string | null
  >(null)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1

  const { events } = useEvents({ year, month })

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()
  const generateAll = useGenerateEventPayments()

  const currentMonthStart = useMemo(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }, [])
  const isViewingCurrentMonth =
    selectedDate.getFullYear() === currentMonthStart.getFullYear() &&
    selectedDate.getMonth() === currentMonthStart.getMonth()

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setSelectedDate(new Date(newYear, newMonth, 1))
  }
  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return
    setSelectedDate(currentMonthStart)
  }

  const dayEvents = useMemo(() => {
    if (!dayModalKey) return []
    return events.filter((e) => e.date === dayModalKey)
  }, [events, dayModalKey])

  const detailEvent = useMemo(() => {
    if (!detailEventId) return null
    return events.find((e) => e._id === detailEventId) ?? null
  }, [events, detailEventId])

  const openCreate = () => {
    setFormError(null)
    setFormState({ open: true, mode: "create" })
  }
  const openEdit = (event: Event) => {
    setFormError(null)
    setFormState({ open: true, mode: "edit", event })
  }
  const closeForm = () => {
    setFormState((prev) => ({ ...prev, open: false }))
    setFormError(null)
  }

  const handleSubmit = async (values: EventFormValues) => {
    setFormError(null)
    try {
      if (formState.mode === "edit" && formState.event?._id) {
        await updateMutation.trigger({
          id: formState.event._id,
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          year: toOptionalNumber(values.year),
          month: toOptionalNumber(values.month),
          day: toOptionalNumber(values.day),
          hour: toOptionalNumber(values.hour),
          minute: toOptionalNumber(values.minute),
          durationMinutes: toOptionalNumber(values.durationMinutes),
          maxAttendees: toOptionalNumber(values.maxAttendees),
          netAmount: toRequiredNumber(values.netAmount),
          vatAmount: toRequiredNumber(values.vatAmount),
        })
        setToast("Event updated")
      } else {
        await createMutation.trigger({
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          year: toOptionalNumber(values.year),
          month: toOptionalNumber(values.month),
          day: toOptionalNumber(values.day),
          hour: toOptionalNumber(values.hour),
          minute: toOptionalNumber(values.minute),
          durationMinutes: toOptionalNumber(values.durationMinutes),
          maxAttendees: toOptionalNumber(values.maxAttendees),
          netAmount: toRequiredNumber(values.netAmount),
          vatAmount: toRequiredNumber(values.vatAmount),
        })
        setToast("Event created")
      }
      closeForm()
    } catch (error) {
      setFormError(extractErrorMessage(error, "Failed to save event"))
    }
  }

  const handleDelete = async (event: Event) => {
    if (!event._id) return
    const confirmed = window.confirm(
      `Delete event "${event.title}"? This cannot be undone.`
    )
    if (!confirmed) return
    try {
      await deleteMutation.trigger({ id: event._id })
      setToast("Event deleted")
    } catch (error) {
      setToast(extractErrorMessage(error, "Failed to delete event"))
    }
  }

  const handleGenerateAllPayments = async (event: Event) => {
    if (!event._id) return
    setPendingGenerateAllId(event._id)
    try {
      const result = await generateAll.trigger({ eventId: event._id })
      setToast(
        `${result.created.length} created, ${result.skipped.length} skipped`
      )
    } catch (error) {
      setToast(extractErrorMessage(error, "Failed to generate payments"))
    } finally {
      setPendingGenerateAllId(null)
    }
  }

  const isSubmitting =
    formState.mode === "edit"
      ? updateMutation.isMutating
      : createMutation.isMutating

  return (
    <PageLayout
      navigationSubtitle="Events"
      headerContent={
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Events
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {formatMonthYear(selectedDate)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MonthPicker
                selectedDate={selectedDate}
                onMonthChange={handleMonthChange}
                showCalendar={showCalendar}
                onShowCalendarChange={setShowCalendar}
                isViewingCurrentMonth={isViewingCurrentMonth}
                onGoToCurrentMonth={handleGoToCurrentMonth}
              />
              <button
                type="button"
                onClick={openCreate}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                New event
              </button>
            </div>
          </div>
        </div>
      }
    >
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="space-y-8">
        <EventsMonthCalendar
          events={events}
          selectedDate={selectedDate}
          onDayClick={setDayModalKey}
        />
        <EventsListTable
          events={events}
          onEdit={openEdit}
          onDelete={handleDelete}
          onOpenDetail={(e) => setDetailEventId(e._id ?? null)}
          onGenerateAllPayments={handleGenerateAllPayments}
          pendingGenerateAllId={pendingGenerateAllId}
        />
      </div>

      <EventFormModal
        mode={formState.mode}
        event={formState.event}
        isOpen={formState.open}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={formError}
      />

      {dayModalKey && (
        <DayEventsModal
          dateKey={dayModalKey}
          events={dayEvents}
          onClose={() => setDayModalKey(null)}
          onEdit={(e) => {
            setDayModalKey(null)
            openEdit(e)
          }}
          onDelete={(e) => {
            void handleDelete(e)
          }}
          onOpenDetail={(e) => {
            setDayModalKey(null)
            setDetailEventId(e._id ?? null)
          }}
        />
      )}

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          isOpen
          onClose={() => setDetailEventId(null)}
          onEdit={(e) => {
            setDetailEventId(null)
            openEdit(e)
          }}
          onActionSuccess={(message) => setToast(message)}
          onActionError={(message) => setToast(message)}
        />
      )}
    </PageLayout>
  )
}
