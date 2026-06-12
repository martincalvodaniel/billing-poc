"use client"

import FormField from "@/app/components/FormField"
import NumberStepperInput from "@/app/components/NumberStepperInput"
import type { EventFormValues } from "./eventFormModal-utils"

interface EventScheduleFieldsProps {
  idPrefix: string
  values: EventFormValues
  isSubmitting: boolean
  onChangeValue: (field: keyof EventFormValues) => (value: string) => void
}

export default function EventScheduleFields({
  idPrefix,
  values,
  isSubmitting,
  onChangeValue,
}: EventScheduleFieldsProps) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3">
      <FormField id={`${idPrefix}-duration`} label="Duration (minutes)">
        <NumberStepperInput
          id={`${idPrefix}-duration`}
          min={30}
          step={30}
          value={values.durationMinutes}
          onValueChange={onChangeValue("durationMinutes")}
          disabled={isSubmitting}
          ariaLabel="Duration in minutes"
        />
      </FormField>
      <FormField id={`${idPrefix}-max`} label="Max attendees">
        <NumberStepperInput
          id={`${idPrefix}-max`}
          min={1}
          step={1}
          value={values.maxAttendees}
          onValueChange={onChangeValue("maxAttendees")}
          disabled={isSubmitting}
          ariaLabel="Max attendees"
        />
      </FormField>
    </div>
  )
}
