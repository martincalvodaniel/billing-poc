import type { ReactNode } from "react"
import CurrentMonthButton from "./CurrentMonthButton"
import GoToCurrentButton from "./GoToCurrentButton"
import NextMonthButton from "./NextMonthButton"
import PrevMonthButton from "./PrevMonthButton"

interface MonthNavigationControlsProps {
  selectedDate: Date
  showCalendar: boolean
  isViewingCurrentMonth: boolean
  onGoToCurrentMonth: () => void
  onShowCalendarChange: (show: boolean) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  overlay?: ReactNode
}

export default function MonthNavigationControls({
  selectedDate,
  showCalendar,
  isViewingCurrentMonth,
  onGoToCurrentMonth,
  onShowCalendarChange,
  onPrevMonth,
  onNextMonth,
  overlay,
}: MonthNavigationControlsProps) {
  return (
    <>
      <GoToCurrentButton
        disabled={isViewingCurrentMonth}
        onClick={onGoToCurrentMonth}
        label="Go to current month"
      />
      <div className="flex items-center gap-0.75">
        <PrevMonthButton onClick={onPrevMonth} />
        <div className="relative">
          <CurrentMonthButton
            selectedDate={selectedDate}
            showCalendar={showCalendar}
            onToggle={() => onShowCalendarChange(!showCalendar)}
          />
          {overlay}
        </div>
        <NextMonthButton onClick={onNextMonth} />
      </div>
    </>
  )
}
