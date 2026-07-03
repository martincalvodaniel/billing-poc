export const WORDPRESS_COUPON_VAT_RATE = 0.21

export interface WordPressCoupon {
  id: number
  code: string
  amount: string
  status: string
  description: string
  date_expires_gmt: string
  usage_count: number
  usage_limit: number
  used_by: string[]
}

interface WordPressCouponsPagination {
  page: number
  totalPages: number
  total: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface WordPressCouponsResponse {
  items: WordPressCoupon[]
  pagination: WordPressCouponsPagination
}

export interface CreateWordPressCouponInput {
  description: string
  amount: number
  dateExpires: string
}
