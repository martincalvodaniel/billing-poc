import type { PaymentFormData } from "@/lib/domain/entities/payment"
import type { Product } from "@/lib/domain/entities/product"

export type SalePaymentTag = "LocalSale" | "MarketSale" | "Cocción"

export function buildSalePaymentFormData(
  products: Product[],
  tag: SalePaymentTag,
  date: string
): PaymentFormData {
  return {
    type: "income",
    date,
    concepts: products.map((product) => ({
      productId: product._id,
      name: product.name,
      amount: product.finalPrice,
      quantity: 1,
    })),
    vat: "21",
    surcharge: "",
    discount: "",
    tag,
    clientId: undefined,
    deliveryNoteRef: "",
    paymentMethod: "",
  }
}
