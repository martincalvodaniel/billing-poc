"use client"

import dynamic from "next/dynamic"
import PageLayout from "@/app/components/PageLayout"
import Toast from "@/app/components/Toast"
import EventDeleteDialog from "./EventDeleteDialog"
import EventsListTable from "./EventsListTable"
import EventsMonthCalendar from "./EventsMonthCalendar"
import EventsPageHeader from "./EventsPageHeader"
import { useEventsPageState } from "./useEventsPageState"

const DayEventsModal = dynamic(() => import("./DayEventsModal"), {
  ssr: false,
})
const EditEventModal = dynamic(() => import("./EditEventModal"), {
  ssr: false,
})
const NewEventModal = dynamic(() => import("./NewEventModal"), {
  ssr: false,
})

export default function EventsPageContent() {
  const {
    events,
    selectedDate,
    showCalendar,
    setShowCalendar,
    isViewingCurrentMonth,
    handleMonthChange,
    handleGoToCurrentMonth,
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
          onAddEvent={() => openCreate()}
        />
      }
    >
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="space-y-8">
        <EventsMonthCalendar
          events={events}
          selectedDate={selectedDate}
          onDayClick={setDayModalKey}
          onEventClick={openEdit}
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
          errorMessage={formError}
          onAttendeeSuccess={(msg) => setToast(msg)}
          onAttendeeError={(msg) => setToast(msg)}
          onExcludedDatesChange={(excludedDates) => {
            void handlePersistExcludedDates(excludedDates)
          }}
        />
      ) : (
        <NewEventModal
          isOpen={formState.open}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={formError}
          defaults={formDefaults}
          seedValues={copySeed}
          resetKey={copySeed ? `copy-${copyKey}` : "create"}
        />
      )}

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
          onSkipOccurrence={(e, key) => {
            void handleSkipOccurrence(e, key)
          }}
          onAddEventForDay={(day) => {
            setDayModalKey(null)
            openCreate(day)
          }}
        />
      )}

      <EventDeleteDialog
        event={deleteDialogEvent}
        isPending={isDeletePending}
        error={deleteDialogError}
        onCancel={handleCancelDelete}
        onConfirm={() => void handleConfirmDelete()}
      />
    </PageLayout>
  )
}
