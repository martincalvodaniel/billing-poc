export function getCouponPdfDisplayExpiryDate(expiryDate: string): string {
  const [year, month, day] = expiryDate.split("-").map(Number)
  const displayDate = new Date(Date.UTC(year, month - 1, day))
  displayDate.setUTCDate(displayDate.getUTCDate() - 1)

  return displayDate.toISOString().slice(0, 10)
}
