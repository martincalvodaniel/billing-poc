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
  isSubmitting: boolean
  titleRef: React.Ref<HTMLInputElement>
  onChangeField: (
    field: keyof EventFormValues
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onDateChange: (next: PartialDateValue) => void
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function EventBasicFields({
  idPrefix,
  values,
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

  return (
    <>
      <FormField id={`${idPrefix}-title`} label="Title" required>
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

      <FormField id={`${idPrefix}-description`} label="Description">
        <textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={onChangeField("description")}
          disabled={isSubmitting}
          maxLength={2000}
          rows={2}
          className={inputClass}
        />
      </FormField>

      <div className="space-y-1">
        <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Date (optional)
        </span>
        <PartialDatePicker
          value={partialDateFromValues(values)}
          onChange={onDateChange}
          disabled={isSubmitting}
          ariaLabelPrefix="Event date"
        />
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
