"use client"

import { useId, useMemo, useRef, useState } from "react"
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/domain/entities/payment"
import { useClickOutside } from "@/lib/hooks/useClickOutside"
import { BankTransferIcon } from "./icons/BankTransferIcon"
import { CardIcon } from "./icons/CardIcon"
import { CashIcon } from "./icons/CashIcon"
import { XIcon } from "./icons/XIcon"

const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  {
    label: string
    Icon: React.ComponentType<{ className?: string }>
    iconClassName: string
  }
> = {
  cash: {
    label: PAYMENT_METHOD_LABELS.cash,
    Icon: CashIcon,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  card: {
    label: PAYMENT_METHOD_LABELS.card,
    Icon: CardIcon,
    iconClassName: "text-blue-600 dark:text-blue-400",
  },
  bank_transfer: {
    label: PAYMENT_METHOD_LABELS.bank_transfer,
    Icon: BankTransferIcon,
    iconClassName: "text-zinc-700 dark:text-zinc-300",
  },
}

interface PaymentMethodDropdownProps {
  value?: PaymentMethod | ""
  onChange: (value: PaymentMethod | "") => void
  label?: string
}

export default function PaymentMethodDropdown({
  value,
  onChange,
  label = "Payment Method (Optional)",
}: PaymentMethodDropdownProps) {
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false)
    },
    isOpen
  )

  const selectedPaymentMethod = useMemo(
    () =>
      value && value in PAYMENT_METHOD_CONFIG
        ? PAYMENT_METHOD_CONFIG[value]
        : null,
    [value]
  )

  const handleSelect = (nextValue: PaymentMethod | "") => {
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={`${id}-paymentMethod-trigger`}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <button
          id={`${id}-paymentMethod-trigger`}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={`${id}-paymentMethod-list`}
          className="flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <span className="inline-flex items-center gap-2">
            {selectedPaymentMethod ? (
              <>
                <selectedPaymentMethod.Icon
                  className={`h-4 w-4 ${selectedPaymentMethod.iconClassName}`}
                />
                <span>{selectedPaymentMethod.label}</span>
              </>
            ) : (
              <>
                <XIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span>— Not specified —</span>
              </>
            )}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={`h-4 w-4 text-zinc-500 transition-transform dark:text-zinc-400 ${isOpen ? "rotate-180" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <ul
            id={`${id}-paymentMethod-list`}
            aria-label="Payment method options"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          >
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelect("")}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-zinc-900 hover:bg-zinc-100 focus:outline-none focus:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700"
              >
                <XIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span>— Not specified —</span>
              </button>
            </li>

            {PAYMENT_METHODS.map((method) => {
              const option = PAYMENT_METHOD_CONFIG[method]
              return (
                <li key={method}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(method)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-zinc-900 hover:bg-zinc-100 focus:outline-none focus:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700"
                  >
                    <option.Icon
                      className={`h-4 w-4 ${option.iconClassName}`}
                    />
                    <span>{option.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
