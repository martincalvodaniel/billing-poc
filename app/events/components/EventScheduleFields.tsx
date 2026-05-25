"use client"

import FormField from "@/app/components/FormField"
import { type EventFormValues, inputClass } from "./eventFormModal-utils"

interface EventScheduleFieldsProps {
  idPrefix: string
  values: EventFormValues
  isSubmitting: boolean
  onChangeField: (
    field: keyof EventFormValues
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function EventScheduleFields({
  idPrefix,
  values,
  isSubmitting,
  onChangeField,
}: EventScheduleFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField id={`${idPrefix}-duration`} label="Duration (minutes)">
        <input
          id={`${idPrefix}-duration`}
          type="number"
          inputMode="numeric"
          min={30}
          step={30}
          value={values.durationMinutes}
          onChange={onChangeField("durationMinutes")}
          disabled={isSubmitting}
          aria-label="Duration in minutes"
          className={inputClass}
        />
      </FormField>
      <FormField id={`${idPrefix}-max`} label="Max attendees">
        <input
          id={`${idPrefix}-max`}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={values.maxAttendees}
          onChange={onChangeField("maxAttendees")}
          disabled={isSubmitting}
          aria-label="Max attendees"
          className={inputClass}
        />
      </FormField>
    </div>
  )
}
