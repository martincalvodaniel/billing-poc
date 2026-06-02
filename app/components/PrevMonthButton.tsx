import NavButton from "./NavButton"

export default function PrevMonthButton({ onClick }: { onClick: () => void }) {
  return (
    <NavButton onClick={onClick} aria-label="View previous month">
      ←
    </NavButton>
  )
}
