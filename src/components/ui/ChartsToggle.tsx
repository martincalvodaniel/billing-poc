import BinaryToggle, { type BinaryToggleValue } from "./BinaryToggle"

export default function ChartsToggle({
  showCharts,
  onToggle,
}: {
  showCharts: boolean
  onToggle: (show: boolean) => void
}) {
  const handleChange = (value: BinaryToggleValue) => {
    onToggle(value === "left")
  }

  return (
    <BinaryToggle
      value={showCharts ? "left" : "right"}
      leftLabel="Show"
      rightLabel="Hide"
      ariaLabel="Toggle charts visibility"
      onChange={handleChange}
      leading="📊"
    />
  )
}
