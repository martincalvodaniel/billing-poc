"use client"

import type { Ref } from "react"
import { useAbsenceStudents } from "@/features/absences/hooks/useAbsenceStudents"

interface StudentNameAutocompleteProps {
  id: string
  datalistId: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  inputRef?: Ref<HTMLInputElement>
}

export default function StudentNameAutocomplete({
  id,
  datalistId,
  value,
  onChange,
  disabled,
  inputRef,
}: StudentNameAutocompleteProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value)

  const { students: options } = useAbsenceStudents(value)
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Student name
      </label>
      <input
        type="text"
        id={id}
        name="studentName"
        list={datalistId}
        ref={inputRef}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required
        autoComplete="off"
        placeholder="Type to search…"
        className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <datalist id={datalistId}>
        {options.map((name) => (
          <option key={name.toLowerCase()} value={name} />
        ))}
      </datalist>
    </div>
  )
}
