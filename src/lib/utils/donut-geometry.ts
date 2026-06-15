export interface DonutSegment {
  tag: string
  percentage: number
  color: string
  path: string
}

interface ComputeSegmentsArgs {
  entries: Array<[string, number]>
  total: number
  colorMap: Map<string, string>
  colors: string[]
}

export function computeDonutSegments({
  entries,
  total,
  colorMap,
  colors,
}: ComputeSegmentsArgs): DonutSegment[] {
  const centerX = 60
  const centerY = 60
  const outerRadius = 45
  const innerRadius = 30
  const round = (n: number) => n.toFixed(2)
  let currentAngle = -90 // Start from top
  const result: DonutSegment[] = []

  entries.forEach(([tag, value]) => {
    const percentage = (value / total) * 100
    const sliceAngle = (percentage / 100) * 360
    const color = colorMap.get(tag) || colors[0]

    if (sliceAngle === 360) {
      // Full-circle slice rendered as two semicircles (SVG arcs cannot draw 360°).
      const startRad = (-90 * Math.PI) / 180
      const midRad = (90 * Math.PI) / 180
      const endRad = (270 * Math.PI) / 180

      const x1 = centerX + outerRadius * Math.cos(startRad)
      const y1 = centerY + outerRadius * Math.sin(startRad)
      const x2 = centerX + outerRadius * Math.cos(midRad)
      const y2 = centerY + outerRadius * Math.sin(midRad)
      const x3 = centerX + outerRadius * Math.cos(endRad)
      const y3 = centerY + outerRadius * Math.sin(endRad)

      const x4 = centerX + innerRadius * Math.cos(endRad)
      const y4 = centerY + innerRadius * Math.sin(endRad)
      const x5 = centerX + innerRadius * Math.cos(midRad)
      const y5 = centerY + innerRadius * Math.sin(midRad)
      const x6 = centerX + innerRadius * Math.cos(startRad)
      const y6 = centerY + innerRadius * Math.sin(startRad)

      const pathData = `
        M ${round(x1)} ${round(y1)}
        A ${outerRadius} ${outerRadius} 0 0 1 ${round(x2)} ${round(y2)}
        A ${outerRadius} ${outerRadius} 0 0 1 ${round(x3)} ${round(y3)}
        L ${round(x4)} ${round(y4)}
        A ${innerRadius} ${innerRadius} 0 0 0 ${round(x5)} ${round(y5)}
        A ${innerRadius} ${innerRadius} 0 0 0 ${round(x6)} ${round(y6)}
        Z
      `

      result.push({ tag, percentage, color, path: pathData })
    } else {
      const endAngle = currentAngle + sliceAngle
      const startRad = (currentAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1 = centerX + outerRadius * Math.cos(startRad)
      const y1 = centerY + outerRadius * Math.sin(startRad)
      const x2 = centerX + outerRadius * Math.cos(endRad)
      const y2 = centerY + outerRadius * Math.sin(endRad)
      const x3 = centerX + innerRadius * Math.cos(endRad)
      const y3 = centerY + innerRadius * Math.sin(endRad)
      const x4 = centerX + innerRadius * Math.cos(startRad)
      const y4 = centerY + innerRadius * Math.sin(startRad)

      const largeArc = sliceAngle > 180 ? 1 : 0

      const pathData = `
        M ${round(x1)} ${round(y1)}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${round(x2)} ${round(y2)}
        L ${round(x3)} ${round(y3)}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${round(x4)} ${round(y4)}
        Z
      `

      result.push({ tag, percentage, color, path: pathData })
      currentAngle = endAngle
    }
  })

  return result
}
