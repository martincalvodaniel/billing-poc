"use client"
import { useCallback, useId } from "react"
import ClientSelector from "@/components/shared/ClientSelector"
import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton"
import { EmptyState } from "@/components/ui/EmptyState"
import ClientFormModal from "@/features/clients/components/ClientFormModal"
import PaymentDetailModal from "@/features/payments/components/month/PaymentDetailModal"
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
  const handleEmailsCopied = useCallback(() => {
    onActionSuccess("Emails copied to clipboard")
  }, [onActionSuccess])
  const handleEmailsCopyError = useCallback(() => {
    onActionError("Failed to copy emails")
  }, [onActionError])
  const id = useId()
  const {
    clientNameById,
    editingClient,
    hasEmails,
    emailsString,
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
          <CopyToClipboardButton
            value={emailsString}
            disabled={!hasEmails}
            ariaLabel="Copy attendee emails"
            title={hasEmails ? "Copy attendee emails" : "No attendees to copy"}
            copiedTitle="Emails copied to clipboard"
            onCopied={handleEmailsCopied}
            onCopyError={handleEmailsCopyError}
          />
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
