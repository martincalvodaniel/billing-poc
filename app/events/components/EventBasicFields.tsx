"use client"

import dynamic from "next/dynamic"
import FormField from "@/app/components/FormField"
import type { PartialDateValue } from "@/app/components/partialDatePicker-utils"
import {
  type EventFormValues,
  inputClass,
  partialDateFromValues,
  stringToOptionalNumber,
} from "./eventFormModal-utils"
import { formatTimeOfDay } from "./eventsUi"

const PartialDatePicker = dynamic(
  () => import("@/app/components/PartialDatePicker"),
  { ssr: false }
)

interface EventBasicFieldsProps {
  idPrefix: string
  values: EventFormValues
  isRecurring: boolean
  isSubmitting: boolean
  titleRef: React.Ref<HTMLInputElement>
  onChangeField: (
    field: keyof EventFormValues
  ) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void
  onDateChange: (next: PartialDateValue) => void
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function EventBasicFields({
  idPrefix,
  values,
  isRecurring,
  isSubmitting,
  titleRef,
  onChangeField,
  onDateChange,
  onTimeChange,
}: EventBasicFieldsProps) {
  const timeValue = formatTimeOfDay(
    stringToOptionalNumber(values.hour),
    stringToOptionalNumber(values.minute)
  )
  const hasConcreteDay = values.day.trim().length > 0

  return (
    <>
      <FormField id={`${idPrefix}-title`} label="Title">
        <input
          ref={titleRef}
          id={`${idPrefix}-title`}
          type="text"
          value={values.title}
          onChange={onChangeField("title")}
          disabled={isSubmitting}
          required
          maxLength={200}
          className={inputClass}
        />
      </FormField>
      <FormField id={`${idPrefix}-tag`} label="Tag (optional)">
        <input
          id={`${idPrefix}-tag`}
          type="text"
          value={values.tag}
          onChange={onChangeField("tag")}
          disabled={isSubmitting}
          maxLength={100}
          placeholder="event"
          className={inputClass}
        />
      </FormField>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-3">
        <div className="space-y-1 md:flex-1">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Date (optional)
          </span>
          <PartialDatePicker
            value={partialDateFromValues(values)}
            onChange={onDateChange}
            disabled={isSubmitting}
            disableDay={isRecurring}
            ariaLabelPrefix="Event date"
          />
        </div>

        <FormField id={`${idPrefix}-dayOfWeek`} label="Repeat weekly on">
          <div className="relative">
            <select
              id={`${idPrefix}-dayOfWeek`}
              value={hasConcreteDay ? "" : values.dayOfWeek}
              onChange={onChangeField("dayOfWeek")}
              disabled={isSubmitting || hasConcreteDay}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 md:w-[180px] md:pr-8 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
            >
              <option value="">— Not recurring —</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="0">Sunday</option>
            </select>
            {!hasConcreteDay && values.dayOfWeek && (
              <button
                type="button"
                onClick={() => {
                  const setDayOfWeek = onChangeField("dayOfWeek")
                  setDayOfWeek({
                    target: { value: "" },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }}
                disabled={isSubmitting}
                aria-label="Clear repeat weekly"
                className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-300 bg-white text-[10px] leading-none text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/60 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        </FormField>
      </div>

      <FormField id={`${idPrefix}-time`} label="Time (optional)">
        <input
          id={`${idPrefix}-time`}
          type="time"
          step={60}
          value={timeValue}
          onChange={onTimeChange}
          disabled={isSubmitting}
          className={inputClass}
        />
      </FormField>
    </>
  )
}
