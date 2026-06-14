import NavButton from "./NavButton"

export default function NextMonthButton({ onClick }: { onClick: () => void }) {
  return (
    <NavButton onClick={onClick} aria-label="View next month">
      →
    </NavButton>
  )
}
