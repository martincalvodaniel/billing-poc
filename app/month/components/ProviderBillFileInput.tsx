"use client"

import type { Ref } from "react"

interface ProviderBillFileInputProps {
  inputId: string
  file: File | null
  uploadError: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  inputRef?: Ref<HTMLInputElement>
}

export default function ProviderBillFileInput({
  inputId,
  file,
  uploadError,
  onChange,
  inputRef,
}: ProviderBillFileInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Provider Bill (Optional)
      </label>
      {uploadError && (
        <div
          className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400"
          role="alert"
        >
          {uploadError}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        id={inputId}
        accept="application/pdf"
        onChange={onChange}
        className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      {file && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </p>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Max file size: 10MB. Only PDF files allowed.
      </p>
    </div>
  )
}
