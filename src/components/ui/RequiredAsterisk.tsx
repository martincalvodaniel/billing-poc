interface RequiredAsteriskProps {
  className?: string
}

export default function RequiredAsterisk({
  className = "",
}: RequiredAsteriskProps) {
  return (
    <span className={`ml-1 text-red-600 ${className}`}>
      <span aria-hidden="true">*</span>
    </span>
  )
}
