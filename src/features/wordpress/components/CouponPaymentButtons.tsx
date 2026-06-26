import { IconButton } from "@/components/ui/IconButton"
import { BankTransferIcon } from "@/components/ui/icons/BankTransferIcon"
import { CardIcon } from "@/components/ui/icons/CardIcon"
import { CashIcon } from "@/components/ui/icons/CashIcon"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { PaymentMethod } from "@/lib/domain/entities/payment"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"

interface CouponPaymentButtonsProps {
  coupon: WordPressCoupon
  onOpenPayment: (coupon: WordPressCoupon, paymentMethod: PaymentMethod) => void
}

export function CouponPaymentButtons({
  coupon,
  onOpenPayment,
}: CouponPaymentButtonsProps) {
  const handleCashPayment = useStableCallback(() => {
    onOpenPayment(coupon, "cash")
  })
  const handleCardPayment = useStableCallback(() => {
    onOpenPayment(coupon, "card")
  })
  const handleBankTransferPayment = useStableCallback(() => {
    onOpenPayment(coupon, "bank_transfer")
  })
  return (
    <>
      <IconButton
        variant="success"
        onClick={handleCashPayment}
        ariaLabel={`Create cash gift card payment for coupon ${coupon.code}`}
        title="Create cash payment"
      >
        <CashIcon />
      </IconButton>
      <IconButton
        variant="info"
        onClick={handleCardPayment}
        ariaLabel={`Create card gift card payment for coupon ${coupon.code}`}
        title="Create card payment"
      >
        <CardIcon />
      </IconButton>
      <IconButton
        variant="neutral"
        onClick={handleBankTransferPayment}
        ariaLabel={`Create bank transfer gift card payment for coupon ${coupon.code}`}
        title="Create bank transfer payment"
      >
        <BankTransferIcon />
      </IconButton>
    </>
  )
}
