import { PlusIcon } from "../icons"

interface AddRecordButtonProps {
  onClick: () => void
  /**
   * Optional visible text rendered next to the plus icon. Pass
   * `"Add"` to keep the existing day-modal `RecordSection` look;
   * omit for an icon-only button (used in `StudentDetailModal`).
   */
  label?: string
  ariaLabel?: string
  title?: string
  className?: string
  disabled?: boolean
}

/**
 * Shared "+ add record" trigger used by `RecordSection` (4 instances
 * inside `DayDetailModal`) and the Records header in
 * `StudentDetailModal`. Visual style matches the previous inline
 * button in `RecordSection` (blue-600) for consistency across both
 * call sites.
 */
export default function AddRecordButton({
  onClick,
  label,
  ariaLabel = "Add record",
  title = "Add record",
  className = "",
  disabled = false,
}: AddRecordButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800 ${className}`}
    >
      <PlusIcon />
      {label && <span>{label}</span>}
    </button>
  )
}
