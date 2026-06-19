import { randomInt } from "node:crypto"
import {
  type CreateWordPressCouponInput,
  WORDPRESS_COUPON_VAT_RATE,
} from "../entities/wordpress-coupon"

const COUPON_CODE_CHARACTERS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const COUPON_CODE_LENGTH = 8
const NET_AMOUNT_DECIMAL_PLACES = 13

export interface WordPressCouponPayload {
  code: string
  description: string
  discount_type: "fixed_cart"
  amount: string
  date_expires: string
  usage_limit: 1
  usage_limit_per_user: 1
}

export function generateWordPressCouponCode(): string {
  return Array.from({ length: COUPON_CODE_LENGTH }, () => {
    return COUPON_CODE_CHARACTERS[randomInt(0, COUPON_CODE_CHARACTERS.length)]
  }).join("")
}

export function calculateWordPressCouponNetAmount(
  taxInclusiveAmount: number
): string {
  return (taxInclusiveAmount / (1 + WORDPRESS_COUPON_VAT_RATE))
    .toFixed(NET_AMOUNT_DECIMAL_PLACES)
    .replace(/\.?0+$/, "")
}

export function buildWordPressCouponPayload(
  input: CreateWordPressCouponInput,
  code = generateWordPressCouponCode()
): WordPressCouponPayload {
  return {
    code,
    description: input.description,
    discount_type: "fixed_cart",
    amount: calculateWordPressCouponNetAmount(input.amount),
    date_expires: `${input.dateExpires}T00:00:00`,
    usage_limit: 1,
    usage_limit_per_user: 1,
  }
}
