import "server-only"

import type { Payment } from "../../domain/entities/payment"
import type { PaymentFilter } from "../../domain/ports/payment-repository"
import { MongoUpdateBuilder, toObjectId, type UpdateOps } from "./mongo-utils"

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function isoLocalDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function buildPaymentDateQuery(
  filter: PaymentFilter
): Record<string, unknown> {
  if (filter.year && filter.month) {
    const lastDay = new Date(filter.year, filter.month, 0).getDate()
    return {
      date: {
        $gte: isoLocalDate(filter.year, filter.month, 1),
        $lte: isoLocalDate(filter.year, filter.month, lastDay),
      },
    }
  }

  if (filter.year) {
    return {
      date: {
        $gte: isoLocalDate(filter.year, 1, 1),
        $lte: isoLocalDate(filter.year, 12, 31),
      },
    }
  }

  return {}
}

/**
 * Pure builder for the Mongo update document used by
 * `MongoPaymentRepository.update`. Extracted so it can be unit-tested
 * without touching the driver. Honours the repo conventions: optional
 * fields use `setOrUnset`, semantic-zero fields (`discount`) map 0 →
 * `$unset`, and `updatedAt` is always refreshed.
 */
export function buildPaymentUpdateOps(data: Partial<Payment>): UpdateOps {
  const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

  if (data.type !== undefined) builder.set("type", data.type)
  if (data.date !== undefined) builder.set("date", data.date)
  if (data.tag !== undefined) {
    const trimmed = data.tag.trim()
    builder.setOrUnset("tag", trimmed ? trimmed : undefined)
  }
  if (data.clientId !== undefined) {
    builder.setOrUnset(
      "clientId",
      data.clientId ? toObjectId(data.clientId) : undefined
    )
  }
  if (data.concepts !== undefined) builder.set("concepts", data.concepts)
  if (data.vat !== undefined) builder.set("vat", data.vat)
  if (data.surcharge !== undefined) {
    // surcharge === 0 means "no surcharge" → remove the field entirely.
    builder.setOrUnset(
      "surcharge",
      data.surcharge !== 0 ? data.surcharge : undefined
    )
  }
  if (data.discount !== undefined) {
    // discount === 0 means "no discount" → remove the field entirely.
    builder.setOrUnset(
      "discount",
      data.discount && data.discount > 0 ? data.discount : undefined
    )
  }
  if (data.deliveryNoteRef !== undefined) {
    const trimmed = data.deliveryNoteRef.trim()
    builder.setOrUnset("deliveryNoteRef", trimmed ? trimmed : undefined)
  }
  if (data.total !== undefined) builder.set("total", data.total)
  if (data.netAmount !== undefined) builder.set("netAmount", data.netAmount)
  if (data.vatAmount !== undefined) builder.set("vatAmount", data.vatAmount)
  if (data.surchargeAmount !== undefined) {
    builder.setOrUnset(
      "surchargeAmount",
      data.surchargeAmount !== 0 ? data.surchargeAmount : undefined
    )
  }
  if (data.invoice !== undefined) builder.setOrUnset("invoice", data.invoice)
  if (data.paymentMethod !== undefined) {
    builder.setOrUnset(
      "paymentMethod",
      data.paymentMethod ? data.paymentMethod : undefined
    )
  }

  return builder.build()
}
