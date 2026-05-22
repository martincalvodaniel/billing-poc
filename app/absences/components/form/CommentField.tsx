"use client"

import { useRef } from "react"
import { XIcon } from "../icons"

interface CommentFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  max: number
}

export default function CommentField({
  id,
  value,
  onChange,
  disabled,
  max,
}: CommentFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor={id}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Comment (Optional)
          </label>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange("")
                textareaRef.current?.focus()
              }}
              disabled={disabled}
              aria-label="Clear comment"
              className="inline-flex h-5 w-5 items-center justify-center rounded text-rose-600 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 dark:text-rose-400 dark:hover:text-rose-300"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>
        <span
          className="text-xs text-zinc-500 dark:text-zinc-400"
          aria-live="polite"
          aria-atomic="true"
        >
          {value.length}/{max}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        name="comment"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        disabled={disabled}
        rows={2}
        maxLength={max}
        placeholder="Add a note…"
        className="w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  )
}
