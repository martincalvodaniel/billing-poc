import { CHART_COLORS } from "@/lib/constants"
import DonutChart from "../../components/DonutChart"

export default function PaymentCharts({
  incomeByTag,
  outcomeByTag,
}: {
  incomeByTag: Record<string, number>
  outcomeByTag: Record<string, number>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DonutChart
        data={incomeByTag}
        title="Income by Tag"
        colors={CHART_COLORS}
      />
      <DonutChart
        data={outcomeByTag}
        title="Outcome by Tag"
        colors={CHART_COLORS}
      />
    </div>
  )
}
