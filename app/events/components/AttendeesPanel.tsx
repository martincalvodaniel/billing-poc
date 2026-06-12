"use client"
import { useId } from "react"
import ClientFormModal from "@/app/clients/components/ClientFormModal"
import ClientSelector from "@/app/components/ClientSelector"
import { EmptyState } from "@/app/components/EmptyState"
import { CheckIcon } from "@/app/components/icons/CheckIcon"
import { CopyIcon } from "@/app/components/icons/CopyIcon"
import PaymentDetailModal from "@/app/month/components/PaymentDetailModal"
import type { Event } from "@/lib/domain/entities/event"
import AttendeeRow from "./AttendeeRow"
import CapacityBar from "./CapacityBar"
import InvoiceGuardModal from "./InvoiceGuardModal"
import { useAttendeesPanel } from "./useAttendeesPanel"

interface AttendeesPanelProps {
  event: Event
  onActionSuccess: (message: string) => void
  onActionError: (message: string) => void
}
export default function AttendeesPanel({
  event,
  onActionSuccess,
  onActionError,
}: AttendeesPanelProps) {
  function closePaymentDetail() {
    return setSelectedPayment(null)
  }
  function updateSelectedPayment(
    payment: Parameters<
      NonNullable<React.ComponentProps<typeof PaymentDetailModal>["onUpdate"]>
    >[0]
  ) {
    return setSelectedPayment(payment)
  }
  function handleCopyEmailsClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    void handleCopyEmails()
  }
  function handleClientSelection(
    clientId: Parameters<
      NonNullable<React.ComponentProps<typeof ClientSelector>["onChange"]>
    >[0]
  ) {
    if (clientId) void handleClientChange(clientId)
  }
  function handleInlineCreateClient(
    name: Parameters<
      NonNullable<React.ComponentProps<typeof ClientSelector>["onCreateClient"]>
    >[0]
  ) {
    return void handleCreateClient(name)
  }
  const id = useId()
  const {
    clientNameById,
    editingClient,
    hasEmails,
    copied,
    seats,
    remaining,
    pendingPayment,
    savingClientId,
    openingPaymentId,
    selectedPayment,
    invoiceGuard,
    isCreatingClient,
    selectorResetKey,
    handleEditClient,
    closeEditClient,
    closeInvoiceGuard,
    setSelectedPayment,
    handleClientChange,
    handleCreateClient,
    commitSeats,
    handleRemove,
    handleGenerateOne,
    handleCopyEmails,
    handleOpenPayment,
    handleSelectedPaymentDeleted,
  } = useAttendeesPanel({ event, onActionSuccess, onActionError })
  return (
    <section className="space-y-3">
      <CapacityBar used={seats} max={event.maxAttendees} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Attendees
          </h3>
          <button
            type="button"
            onClick={handleCopyEmailsClick}
            disabled={!hasEmails}
            aria-label="Copy attendee emails"
            title={hasEmails ? "Copy attendee emails" : "No attendees to copy"}
            className="inline-flex items-center justify-center rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:disabled:hover:bg-transparent dark:disabled:hover:text-zinc-400"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {event.attendees.length === 0 ? (
        <EmptyState>No attendees yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {event.attendees.map((attendee) => {
            const name =
              clientNameById.get(attendee.clientId) ?? "Unknown client"
            const isSaving = savingClientId === attendee.clientId
            const isGenerating = pendingPayment === attendee.clientId
            const hasPayment = Boolean(attendee.paymentId)
            return (
              <AttendeeRow
                key={attendee.clientId}
                rowIdPrefix={id}
                attendee={attendee}
                name={name}
                isSaving={isSaving}
                isGenerating={isGenerating}
                hasPayment={hasPayment}
                isOpeningPayment={openingPaymentId === attendee.paymentId}
                onCommit={commitSeats}
                onGenerate={handleGenerateOne}
                onRemove={handleRemove}
                onOpenPayment={handleOpenPayment}
                onEditClient={handleEditClient}
              />
            )
          })}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add attendee
          {remaining !== undefined ? (
            <span className="ml-2 font-normal normal-case">
              ({remaining} seat{remaining === 1 ? "" : "s"} remaining)
            </span>
          ) : null}
        </p>
        <ClientSelector
          key={selectorResetKey}
          onChange={handleClientSelection}
          label="Client"
          required
          onCreateClient={handleInlineCreateClient}
          isCreating={isCreatingClient}
        />
      </div>

      {invoiceGuard ? (
        <InvoiceGuardModal
          isOpen
          onClose={closeInvoiceGuard}
          invoiceType={invoiceGuard.invoiceType}
          invoiceId={invoiceGuard.invoiceId}
        />
      ) : null}

      <ClientFormModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={closeEditClient}
      />

      {selectedPayment ? (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={closePaymentDetail}
          onUpdate={updateSelectedPayment}
          onDelete={handleSelectedPaymentDeleted}
        />
      ) : null}
    </section>
  )
}
