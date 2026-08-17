"use client"

import { Badge } from "@/components/ui/Badge"
import { useStableCallback } from "@/hooks/useStableCallback"

interface ProductTagFiltersProps {
  availableTags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
}

export default function ProductTagFilters({
  availableTags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: ProductTagFiltersProps) {
  const tagOptions = Array.from(new Set([...availableTags, ...selectedTags]))
  if (tagOptions.length === 0) return null

  return (
    <div className="flex flex-col gap-2 px-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tags
        </span>
        {tagOptions.map((tag) => {
          return (
            <ProductTagFilterButton
              key={tag}
              tag={tag}
              selected={selectedTags.includes(tag)}
              onToggleTag={onToggleTag}
            />
          )
        })}
      </div>
      {selectedTags.length > 0 ? (
        <button
          type="button"
          onClick={onClearTags}
          className="self-start rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:self-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
        >
          Clear tags
        </button>
      ) : null}
    </div>
  )
}

function ProductTagFilterButton({
  tag,
  selected,
  onToggleTag,
}: {
  tag: string
  selected: boolean
  onToggleTag: (tag: string) => void
}) {
  const handleClick = useStableCallback(() => onToggleTag(tag))

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
    >
      <Badge
        tone={selected ? "info" : "neutral"}
        className={
          selected
            ? "ring-1 ring-blue-500"
            : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }
      >
        {tag}
      </Badge>
    </button>
  )
}
