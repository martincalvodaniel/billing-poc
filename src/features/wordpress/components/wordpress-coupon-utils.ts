import type { BadgeTone } from "@/components/ui/badge-utils"
import type {
  PaymentFormData,
  PaymentMethod,
} from "@/lib/domain/entities/payment"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"
import { WORDPRESS_COUPON_VAT_RATE } from "@/lib/domain/entities/wordpress-coupon"
import { formatCurrency } from "@/lib/utils/formatters"

export function getDefaultCouponExpiryDate(now = new Date()): string {
  const expiry = new Date(now)
  expiry.setFullYear(expiry.getFullYear() + 1)
  expiry.setDate(expiry.getDate() + 1)
  expiry.setHours(0, 0, 0, 0)
  const year = expiry.getFullYear()
  const month = String(expiry.getMonth() + 1).padStart(2, "0")
  const day = String(expiry.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatCouponExpiry(value: string): string {
  if (value.length === 0) return "Never"
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const parsed = new Date(hasTimeZone ? value : `${value}Z`)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function getCouponLocalExpiryDate(value: string): string {
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const parsed = new Date(hasTimeZone ? value : `${value}Z`)
  if (Number.isNaN(parsed.getTime())) return ""
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatCouponFinalAmount(value: string): string {
  return formatCurrency(getCouponFinalAmount(value))
}

function getCouponFinalAmount(value: string): number {
  const netAmount = Number.parseFloat(value)
  const finalAmount = Number.isFinite(netAmount)
    ? netAmount * (1 + WORDPRESS_COUPON_VAT_RATE)
    : 0
  return Math.round(finalAmount * 100) / 100
}

export function buildWordpressCouponPdfUrl(
  couponId: number,
  expires: string
): string {
  const params = new URLSearchParams({ expires })
  return `/api/wordpress/coupons/${couponId}/pdf?${params.toString()}`
}

export function getCouponStatusTone(status: string): BadgeTone {
  return status.toLowerCase() === "publish" ? "success" : "neutral"
}

export function buildCouponPaymentFormData(
  coupon: WordPressCoupon,
  paymentMethod: PaymentMethod,
  date: string
): PaymentFormData {
  return {
    type: "income",
    date,
    concepts: [
      {
        name: "Bono regalo",
        amount: getCouponFinalAmount(coupon.amount),
        quantity: 1,
      },
    ],
    vat: "21",
    surcharge: "",
    discount: "",
    tag: "BonoRegalo",
    clientId: undefined,
    deliveryNoteRef: "",
    paymentMethod,
  }
}
