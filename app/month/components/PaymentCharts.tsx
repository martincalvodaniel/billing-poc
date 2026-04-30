"use client"

import { useState } from "react"
import { CHART_COLORS } from "@/lib/constants"
import { formatCurrency } from "@/lib/formatters"
import DonutChart from "../../components/DonutChart"
import Modal from "../../components/Modal"

function MiniDonut({
  data,
  title,
  colors,
  onClick,
}: {
  data: Record<string, number>
  title: string
  colors: string[]
  onClick: () => void
}) {
  const entries = Object.entries(data)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  if (total === 0) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-xs text-zinc-500">{title}</span>
        <span className="text-xs text-zinc-400">No data</span>
      </div>
    )
  }

  // Build segments
  const segments: Array<{ tag: string; color: string; path: string }> = []
  let currentAngle = -90
  const cx = 40
  const cy = 40
  const outer = 35
  const inner = 22

  for (const [tag] of entries) {
    const value = data[tag]
    const pct = (value / total) * 100
    const sliceAngle = (pct / 100) * 360
    const idx = entries.findIndex(([t]) => t === tag)
    const c = colors[idx % colors.length]

    if (sliceAngle >= 360) {
      const r1 = (-90 * Math.PI) / 180
      const r2 = (90 * Math.PI) / 180
      const r3 = (270 * Math.PI) / 180
      segments.push({
        tag,
        color: c,
        path: `M ${cx + outer * Math.cos(r1)} ${cy + outer * Math.sin(r1)} A ${outer} ${outer} 0 0 1 ${cx + outer * Math.cos(r2)} ${cy + outer * Math.sin(r2)} A ${outer} ${outer} 0 0 1 ${cx + outer * Math.cos(r3)} ${cy + outer * Math.sin(r3)} L ${cx + inner * Math.cos(r3)} ${cy + inner * Math.sin(r3)} A ${inner} ${inner} 0 0 0 ${cx + inner * Math.cos(r2)} ${cy + inner * Math.sin(r2)} A ${inner} ${inner} 0 0 0 ${cx + inner * Math.cos(r1)} ${cy + inner * Math.sin(r1)} Z`,
      })
    } else {
      const endAngle = currentAngle + sliceAngle
      const s = (currentAngle * Math.PI) / 180
      const e = (endAngle * Math.PI) / 180
      const la = sliceAngle > 180 ? 1 : 0
      segments.push({
        tag,
        color: c,
        path: `M ${cx + outer * Math.cos(s)} ${cy + outer * Math.sin(s)} A ${outer} ${outer} 0 ${la} 1 ${cx + outer * Math.cos(e)} ${cy + outer * Math.sin(e)} L ${cx + inner * Math.cos(e)} ${cy + inner * Math.sin(e)} A ${inner} ${inner} 0 ${la} 0 ${cx + inner * Math.cos(s)} ${cy + inner * Math.sin(s)} Z`,
      })
      currentAngle = endAngle
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{title}</span>
      <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
        {segments.map((seg) => (
          <path key={seg.tag} d={seg.path} fill={seg.color} />
        ))}
      </svg>
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {formatCurrency(total)}
      </span>
    </button>
  )
}

export default function PaymentCharts({
  incomeByTag,
  outcomeByTag,
}: {
  incomeByTag: Record<string, number>
  outcomeByTag: Record<string, number>
}) {
  const [expandedChart, setExpandedChart] = useState<
    "income" | "outcome" | null
  >(null)

  const expandedData = expandedChart === "income" ? incomeByTag : outcomeByTag
  const expandedTitle =
    expandedChart === "income" ? "Income by Tag" : "Outcome by Tag"

  return (
    <>
      {/* Mobile: compact horizontal scroll with mini donuts */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden">
        <MiniDonut
          data={incomeByTag}
          title="Income"
          colors={CHART_COLORS}
          onClick={() => setExpandedChart("income")}
        />
        <MiniDonut
          data={outcomeByTag}
          title="Outcome"
          colors={CHART_COLORS}
          onClick={() => setExpandedChart("outcome")}
        />
      </div>

      {/* Modal for expanded chart (mobile only) */}
      {expandedChart && (
        <Modal
          isOpen
          onClose={() => setExpandedChart(null)}
          title={expandedTitle}
          maxWidth="md"
        >
          <DonutChart
            data={expandedData}
            title={expandedTitle}
            colors={CHART_COLORS}
          />
        </Modal>
      )}

      {/* Desktop: full donut charts */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2">
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
    </>
  )
}
