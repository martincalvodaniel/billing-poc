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
  () => {
    return import("@/app/components/PartialDatePicker")
  },
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
  function handleChangeField() {
    const setDayOfWeek = onChangeField("dayOfWeek")
    setDayOfWeek({
      target: { value: "" },
    } as React.ChangeEvent<HTMLSelectElement>)
  }
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
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="space-y-1">
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
              className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[180px] md:pr-8 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
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
            {!hasConcreteDay && values.dayOfWeek ? (
              <button
                type="button"
                onClick={handleChangeField}
                disabled={isSubmitting}
                aria-label="Clear repeat weekly"
                className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-300 bg-white text-[10px] leading-none text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/60 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </div>
        </FormField>
      </div>

      <FormField id={`${idPrefix}-time`} label="Time (optional)">
        <input
          id={`${idPrefix}-time`}
          type="time"
          value={timeValue}
          onChange={onTimeChange}
          disabled={isSubmitting}
          className={inputClass}
        />
      </FormField>
    </>
  )
}
