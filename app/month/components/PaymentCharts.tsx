"use client"

import dynamic from "next/dynamic"
import { CHART_COLORS } from "@/lib/constants"

const DonutChart = dynamic(() => import("../../components/DonutChart"), {
  ssr: false,
})

export default function PaymentCharts({
  incomeByTag,
  outcomeByTag,
  selectedTags,
  onToggleTag,
}: {
  incomeByTag: Record<string, number>
  outcomeByTag: Record<string, number>
  selectedTags: string[]
  onToggleTag: (tag: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DonutChart
        data={incomeByTag}
        title="Income by Tag"
        colors={CHART_COLORS}
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
      />
      <DonutChart
        data={outcomeByTag}
        title="Outcome by Tag"
        colors={CHART_COLORS}
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
      />
    </div>
  )
}
