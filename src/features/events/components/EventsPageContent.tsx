"use client"
import dynamic from "next/dynamic"
import PageLayout from "@/components/shared/PageLayout"
import Toast from "@/components/ui/Toast"
import EventDeleteDialog from "./EventDeleteDialog"
import EventsListTable from "./EventsListTable"
import EventsMonthCalendar from "./EventsMonthCalendar"
import EventsPageHeader from "./EventsPageHeader"
import { useEventsPageState } from "./useEventsPageState"

const DayEventsModal = dynamic(
  () => {
    return import("./DayEventsModal")
  },
  {
    ssr: false,
  }
)
const EditEventModal = dynamic(
  () => {
    return import("./EditEventModal")
  },
  {
    ssr: false,
  }
)
const NewEventModal = dynamic(
  () => {
    return import("./NewEventModal")
  },
  {
    ssr: false,
  }
)
export default function EventsPageContent() {
  function clearToast() {
    return setToast(null)
  }
  function closeDayModal() {
    return setDayModalKey(null)
  }
  function editDayEvent(
    e: Parameters<
      NonNullable<React.ComponentProps<typeof DayEventsModal>["onEdit"]>
    >[0]
  ) {
    setDayModalKey(null)
    openEdit(e)
  }
  function handleDayEventDelete(
    e: Parameters<
      NonNullable<React.ComponentProps<typeof DayEventsModal>["onDelete"]>
    >[0]
  ) {
    void handleDelete(e)
  }
  function handleDaySkipOccurrence(
    e: Parameters<
      NonNullable<
        React.ComponentProps<typeof DayEventsModal>["onSkipOccurrence"]
      >
    >[0],
    key: Parameters<
      NonNullable<
        React.ComponentProps<typeof DayEventsModal>["onSkipOccurrence"]
      >
    >[1]
  ) {
    void handleSkipOccurrence(e, key)
  }
  function addEventForDay(
    day: Parameters<
      NonNullable<
        React.ComponentProps<typeof DayEventsModal>["onAddEventForDay"]
      >
    >[0]
  ) {
    setDayModalKey(null)
    openCreate(day)
  }
  function openNewEvent() {
    return openCreate()
  }
  function showAttendeeSuccess(
    msg: Parameters<
      NonNullable<
        React.ComponentProps<typeof EditEventModal>["onAttendeeSuccess"]
      >
    >[0]
  ) {
    return setToast(msg)
  }
  function showAttendeeError(
    msg: Parameters<
      NonNullable<
        React.ComponentProps<typeof EditEventModal>["onAttendeeError"]
      >
    >[0]
  ) {
    return setToast(msg)
  }
  function handleExcludedDatesChange(
    excludedDates: Parameters<
      NonNullable<
        React.ComponentProps<typeof EditEventModal>["onExcludedDatesChange"]
      >
    >[0]
  ) {
    void handlePersistExcludedDates(excludedDates)
  }
  function handleDeleteConfirm() {
    return void handleConfirmDelete()
  }
  const {
    events,
    availableTags,
    selectedDate,
    showCalendar,
    setShowCalendar,
    isViewingCurrentMonth,
    handleMonthChange,
    handleGoToCurrentMonth,
    handleGoToPreviousMonth,
    handleGoToNextMonth,
    formState,
    formError,
    formDefaults,
    copySeed,
    copyKey,
    dayModalKey,
    setDayModalKey,
    dayEvents,
    liveEditEvent,
    toast,
    setToast,
    deleteDialogEvent,
    deleteDialogError,
    isSubmitting,
    isDeletePending,
    openCreate,
    openCopy,
    openEdit,
    closeForm,
    handleSubmit,
    handleDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleSkipOccurrence,
    handlePersistExcludedDates,
  } = useEventsPageState()
  return (
    <PageLayout
      navigationSubtitle="Events"
      headerContent={
        <EventsPageHeader
          selectedDate={selectedDate}
          showCalendar={showCalendar}
          onShowCalendarChange={setShowCalendar}
          isViewingCurrentMonth={isViewingCurrentMonth}
          onGoToCurrentMonth={handleGoToCurrentMonth}
          onMonthChange={handleMonthChange}
          onAddEvent={openNewEvent}
        />
      }
    >
      {toast ? <Toast message={toast} onClose={clearToast} /> : null}

      <div className="space-y-8">
        <EventsMonthCalendar
          events={events}
          selectedDate={selectedDate}
          onDayClick={setDayModalKey}
          onEventClick={openEdit}
          onSwipeToPreviousMonth={handleGoToPreviousMonth}
          onSwipeToNextMonth={handleGoToNextMonth}
        />
        <EventsListTable
          events={events}
          onEdit={openEdit}
          onDelete={handleDelete}
          onCopy={openCopy}
        />
      </div>

      {formState.mode === "edit" && formState.event && liveEditEvent ? (
        <EditEventModal
          event={liveEditEvent}
          isOpen={formState.open}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          availableTags={availableTags}
          errorMessage={formError}
          onAttendeeSuccess={showAttendeeSuccess}
          onAttendeeError={showAttendeeError}
          onExcludedDatesChange={handleExcludedDatesChange}
        />
      ) : (
        <NewEventModal
          isOpen={formState.open}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          availableTags={availableTags}
          errorMessage={formError}
          defaults={formDefaults}
          seedValues={copySeed}
          resetKey={copySeed ? `copy-${copyKey}` : "create"}
        />
      )}

      {dayModalKey ? (
        <DayEventsModal
          dateKey={dayModalKey}
          events={dayEvents}
          onClose={closeDayModal}
          onEdit={editDayEvent}
          onDelete={handleDayEventDelete}
          onSkipOccurrence={handleDaySkipOccurrence}
          onAddEventForDay={addEventForDay}
        />
      ) : null}

      <EventDeleteDialog
        event={deleteDialogEvent}
        isPending={isDeletePending}
        error={deleteDialogError}
        onCancel={handleCancelDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageLayout>
  )
}
