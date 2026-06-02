import type {
  ClientDiffField,
  ClientDiffRow,
  SelectedClientDiffFields,
} from "./wordpress-billing-client-utils"

interface WordpressClientDiffPanelProps {
  clientDiff: ClientDiffRow[]
  selectedDiffFields: SelectedClientDiffFields
  onFieldToggle: (field: ClientDiffField, checked: boolean) => void
}

export function WordpressClientDiffPanel({
  clientDiff,
  selectedDiffFields,
  onFieldToggle,
}: WordpressClientDiffPanelProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Differences to apply
        </h3>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {clientDiff.map((row) => (
          <div key={row.field} className="space-y-3 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {row.label}
              </p>
              <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={selectedDiffFields[row.field]}
                  onChange={(event) => {
                    onFieldToggle(row.field, event.target.checked)
                  }}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>Store</span>
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <DiffValueCard label="Current" value={row.currentValue} />
              <DiffValueCard
                label="Incoming"
                value={row.nextValue}
                variant="incoming"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DiffValueCardProps {
  label: string
  value: string
  variant?: "current" | "incoming"
}

function DiffValueCard({
  label,
  value,
  variant = "current",
}: DiffValueCardProps) {
  const isIncoming = variant === "incoming"

  return (
    <div
      className={
        isIncoming
          ? "rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-900/60 dark:bg-blue-950/20"
          : "rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/40"
      }
    >
      <p
        className={
          isIncoming
            ? "text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
            : "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        }
      >
        {label}
      </p>
      <p
        className={
          isIncoming
            ? "mt-1 text-sm text-zinc-900 [overflow-wrap:anywhere] dark:text-zinc-100"
            : "mt-1 text-sm text-zinc-600 [overflow-wrap:anywhere] dark:text-zinc-300"
        }
      >
        {value}
      </p>
    </div>
  )
}
