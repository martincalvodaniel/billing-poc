"use client"
import { useEffect, useRef, useState } from "react"
import {
  getBadgeSizeClass,
  getBadgeToneClass,
} from "@/app/components/badge-utils"
import { IconButton } from "@/app/components/IconButton"
import { BankTransferIcon } from "@/app/components/icons/BankTransferIcon"
import { CardIcon } from "@/app/components/icons/CardIcon"
import { CashIcon } from "@/app/components/icons/CashIcon"
import { TrashIcon } from "@/app/components/icons/TrashIcon"
import NumberStepperInput from "@/app/components/NumberStepperInput"
import type { EventAttendee } from "@/lib/domain/entities/event"
import type { PaymentMethod } from "@/lib/domain/entities/payment"

interface AttendeeRowProps {
  rowIdPrefix: string
  attendee: EventAttendee
  name: string
  isSaving: boolean
  isGenerating: boolean
  hasPayment: boolean
  isOpeningPayment?: boolean
  onCommit: (
    attendee: EventAttendee,
    nextSeats: string,
    revert: () => void
  ) => Promise<void>
  onGenerate: (clientId: string, paymentMethod: PaymentMethod) => void
  onRemove: (clientId: string) => void
  onOpenPayment: (paymentId: string) => void
  onEditClient: (clientId: string) => void
}
export default function AttendeeRow({
  rowIdPrefix,
  attendee,
  name,
  isSaving,
  isGenerating,
  hasPayment,
  isOpeningPayment,
  onCommit,
  onGenerate,
  onRemove,
  onOpenPayment,
  onEditClient,
}: AttendeeRowProps) {
  function handleOpenPayment() {
    if (attendee.paymentId) onOpenPayment(attendee.paymentId)
  }
  function handleEditClient(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onEditClient(attendee.clientId)
  }
  function handleGenerateCashPayment() {
    return onGenerate(attendee.clientId, "cash")
  }
  function handleGenerateCardPayment() {
    return onGenerate(attendee.clientId, "card")
  }
  function handleGenerateBankTransferPayment() {
    return onGenerate(attendee.clientId, "bank_transfer")
  }
  function handleRemove() {
    return onRemove(attendee.clientId)
  }
  const [seatsValue, setSeatsValue] = useState<string>(String(attendee.seats))
  const lastSyncedRef = useRef<number>(attendee.seats)
  // Keep the local value in sync when the upstream attendee.seats changes
  // (e.g. after a successful mutation triggers a re-render).
  useEffect(() => {
    if (attendee.seats !== lastSyncedRef.current) {
      lastSyncedRef.current = attendee.seats
      setSeatsValue(String(attendee.seats))
    }
  }, [attendee.seats])
  const revert = () => {
    setSeatsValue(String(attendee.seats))
  }
  const handleCommit = () => {
    if (seatsValue === String(attendee.seats)) return
    void onCommit(attendee, seatsValue, revert)
  }
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    handleCommit()
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCommit()
    }
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        {name === "Unknown client" ? (
          <p
            className="truncate font-medium text-zinc-900 dark:text-zinc-100"
            title={attendee.clientId}
          >
            {name}
          </p>
        ) : (
          <button
            type="button"
            className="truncate rounded-sm text-left font-medium text-emerald-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400"
            aria-label={`Edit client ${name}`}
            title={attendee.clientId}
            onClick={handleEditClient}
          >
            {name}
          </button>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <label
            htmlFor={`${rowIdPrefix}-seats-${attendee.clientId}`}
            className="sr-only"
          >
            Seats for {name}
          </label>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: focus/keyboard handlers on a wrapper to detect blur/Enter on the seats input */}
          <div className="w-36" onBlur={handleBlur} onKeyDown={handleKeyDown}>
            <NumberStepperInput
              id={`${rowIdPrefix}-seats-${attendee.clientId}`}
              value={seatsValue}
              onValueChange={setSeatsValue}
              min={1}
              step={1}
              disabled={isSaving}
              ariaLabel={`Seats for ${name}`}
            />
          </div>
          {isSaving ? (
            <span aria-live="polite" aria-atomic="true">
              Saving…
            </span>
          ) : null}
          {hasPayment && !isSaving && attendee.paymentId ? (
            <button
              type="button"
              onClick={handleOpenPayment}
              disabled={isOpeningPayment}
              aria-label={`Open payment for ${name}`}
              className={`inline-flex items-center rounded-full font-medium transition-colors hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-green-900/50 ${getBadgeSizeClass("sm")} ${getBadgeToneClass("success")}`}
            >
              {isOpeningPayment ? "Opening…" : "Payment ✓"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton
          variant="success"
          isPending={isGenerating}
          disabled={hasPayment}
          onClick={handleGenerateCashPayment}
          ariaLabel={
            hasPayment
              ? `Payment already generated for ${name}`
              : `Generate cash payment for ${name}`
          }
          title="Generate cash payment"
        >
          <CashIcon />
        </IconButton>
        <IconButton
          variant="info"
          isPending={isGenerating}
          disabled={hasPayment}
          onClick={handleGenerateCardPayment}
          ariaLabel={
            hasPayment
              ? `Payment already generated for ${name}`
              : `Generate card payment for ${name}`
          }
          title="Generate card payment"
        >
          <CardIcon />
        </IconButton>
        <IconButton
          variant="neutral"
          isPending={isGenerating}
          disabled={hasPayment}
          onClick={handleGenerateBankTransferPayment}
          ariaLabel={
            hasPayment
              ? `Payment already generated for ${name}`
              : `Generate bank transfer payment for ${name}`
          }
          title="Generate bank transfer payment"
        >
          <BankTransferIcon />
        </IconButton>
        <IconButton
          variant="danger"
          onClick={handleRemove}
          ariaLabel={`Remove attendee ${name}`}
        >
          <TrashIcon />
        </IconButton>
      </div>
    </li>
  )
}
