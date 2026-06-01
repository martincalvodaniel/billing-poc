export interface WordPressBilling {
  first_name: string
  last_name: string
  address_1: string
  address_2: string
  city: string
  postcode: string
  country: string
  email: string
  phone: string
}

export interface WordPressLineItemTax {
  id: number
  total: string
  subtotal: string
}

export interface WordPressLineItemImage {
  id: string
  src: string
}

export interface WordPressLineItem {
  name: string
  quantity: number
  subtotal: string
  subtotal_tax: string
  total: string
  total_tax: string
  taxes: WordPressLineItemTax[]
  sku: string
  price: number
  image: WordPressLineItemImage
}

export interface WordPressTaxLine {
  id: number
  rate_code: string
  rate_id: number
  label: string
  compound: boolean
  tax_total: string
  shipping_tax_total: string
  rate_percent: number
}

export interface WordPressOrder {
  id: number
  status: string
  prices_include_tax: boolean
  discount_total: string
  discount_tax: string
  cart_tax: string
  total: string
  total_tax: string
  billing: WordPressBilling
  payment_method: string
  payment_method_title: string
  date_completed: string
  date_paid: string
  line_items: WordPressLineItem[]
  tax_lines: WordPressTaxLine[]
  needs_payment: boolean
  needs_processing: boolean
  date_created_gmt: string
  date_modified_gmt: string
  date_completed_gmt: string
  date_paid_gmt: string
  currency_symbol: string
}

export interface WordPressOrdersPagination {
  page: number
  totalPages: number
  total: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface WordPressOrdersResponse {
  items: WordPressOrder[]
  pagination: WordPressOrdersPagination
}
