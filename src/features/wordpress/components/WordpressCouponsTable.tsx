import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { IconButton } from "@/components/ui/IconButton"
import { IconLink } from "@/components/ui/IconLink"
import { DocumentIcon } from "@/components/ui/icons/DocumentIcon"
import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import PaymentFormModal from "@/features/payments/components/PaymentFormModal"
import { useStableCallback } from "@/hooks/useStableCallback"
import type {
  PaymentFormData,
  PaymentMethod,
} from "@/lib/domain/entities/payment"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"
import { CouponPaymentButtons } from "./CouponPaymentButtons"
import {
  buildCouponPaymentFormData,
  buildWordpressCouponPdfUrl,
  formatCouponExpiry,
  formatCouponFinalAmount,
  getCouponLocalExpiryDate,
  getCouponStatusTone,
} from "./wordpress-coupon-utils"

interface WordpressCouponsTableProps {
  coupons: WordPressCoupon[]
  onDelete: (coupon: WordPressCoupon) => void
  onPaymentSaved?: (coupon: WordPressCoupon) => void
}

export function WordpressCouponsTable({
  coupons,
  onDelete,
  onPaymentSaved,
}: WordpressCouponsTableProps) {
  const [paymentDraft, setPaymentDraft] = useState<{
    coupon: WordPressCoupon
    paymentMethod: PaymentMethod
    date: string
  } | null>(null)
  const initialPaymentData: PaymentFormData | undefined = useMemo(() => {
    if (!paymentDraft) return undefined
    return buildCouponPaymentFormData(
      paymentDraft.coupon,
      paymentDraft.paymentMethod,
      paymentDraft.date
    )
  }, [paymentDraft])
  const handleDelete = useStableCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const couponId =
        event.currentTarget.querySelector<HTMLElement>("[data-coupon-id]")
          ?.dataset.couponId
      const coupon = coupons.find((item) => String(item.id) === couponId)
      if (coupon) onDelete(coupon)
    }
  )
  const openPaymentModal = useStableCallback(
    (coupon: WordPressCoupon, paymentMethod: PaymentMethod) => {
      setPaymentDraft({
        coupon,
        paymentMethod,
        date: new Date().toISOString().split("T")[0],
      })
    }
  )
  const closePaymentModal = useStableCallback(() => {
    setPaymentDraft(null)
  })
  const handlePaymentSaved = useStableCallback(() => {
    if (paymentDraft) onPaymentSaved?.(paymentDraft.coupon)
    setPaymentDraft(null)
  })
  return (
    <>
      <div className="space-y-3 md:hidden">
        {coupons.map((coupon) => (
          <article
            key={coupon.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {coupon.code}
                </p>
                <Badge tone={getCouponStatusTone(coupon.status)} size="sm">
                  {coupon.status}
                </Badge>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <IconLink
                    href={buildWordpressCouponPdfUrl(
                      coupon.id,
                      getCouponLocalExpiryDate(coupon.date_expires_gmt)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    ariaLabel={`Open gift card PDF for coupon ${coupon.code}`}
                    title="Open gift card PDF"
                    variant="info"
                  >
                    <DocumentIcon />
                  </IconLink>
                  <IconButton
                    onClick={handleDelete}
                    ariaLabel={`Delete coupon ${coupon.code}`}
                    title="Delete coupon"
                    variant="danger"
                  >
                    <span data-coupon-id={coupon.id} className="contents">
                      <TrashIcon />
                    </span>
                  </IconButton>
                </div>
                <div className="flex items-center gap-1">
                  <CouponPaymentButtons
                    coupon={coupon}
                    onOpenPayment={openPaymentModal}
                  />
                </div>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div className="col-start-1 row-start-1">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Final price
                </dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {formatCouponFinalAmount(coupon.amount)}
                </dd>
              </div>
              <div className="col-start-2 row-start-1">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Usage
                </dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {coupon.usage_count}/{coupon.usage_limit || "∞"}
                </dd>
              </div>
              <div className="col-start-1 row-start-2">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Date expires
                </dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {formatCouponExpiry(coupon.date_expires_gmt)}
                </dd>
              </div>
              <div className="col-start-2 row-start-2">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Used by
                </dt>
                <dd className="break-all text-zinc-900 dark:text-zinc-100">
                  {coupon.used_by.join(", ") || "-"}
                </dd>
              </div>
              <div className="col-span-2 row-start-3">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Description
                </dt>
                <dd className="break-all text-zinc-900 dark:text-zinc-100">
                  {coupon.description || "-"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 md:block">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60">
            <tr>
              {[
                "Code",
                "Final price",
                "Status",
                "Description",
                "Date expires",
                "Usage",
                "Used by",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300"
                >
                  {heading}
                </th>
              ))}
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {coupons.map((coupon) => (
              <tr
                key={coupon.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <td className="px-4 py-3 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {coupon.code}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                  {formatCouponFinalAmount(coupon.amount)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={getCouponStatusTone(coupon.status)} size="sm">
                    {coupon.status}
                  </Badge>
                </td>
                <td className="max-w-56 break-all px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                  {coupon.description || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                  {formatCouponExpiry(coupon.date_expires_gmt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                  {coupon.usage_count}/{coupon.usage_limit || "∞"}
                </td>
                <td className="max-w-56 break-all px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                  {coupon.used_by.join(", ") || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center justify-end gap-1">
                      <IconLink
                        href={buildWordpressCouponPdfUrl(
                          coupon.id,
                          getCouponLocalExpiryDate(coupon.date_expires_gmt)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        ariaLabel={`Open gift card PDF for coupon ${coupon.code}`}
                        title="Open gift card PDF"
                        variant="info"
                      >
                        <DocumentIcon />
                      </IconLink>
                      <IconButton
                        onClick={handleDelete}
                        ariaLabel={`Delete coupon ${coupon.code}`}
                        title="Delete coupon"
                        variant="danger"
                      >
                        <span data-coupon-id={coupon.id} className="contents">
                          <TrashIcon />
                        </span>
                      </IconButton>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <CouponPaymentButtons
                        coupon={coupon}
                        onOpenPayment={openPaymentModal}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaymentFormModal
        isOpen={paymentDraft !== null}
        onClose={closePaymentModal}
        title="New Gift Card Payment"
        initialDate={paymentDraft?.date}
        initialData={initialPaymentData}
        initialClientQuery={paymentDraft?.coupon.description}
        autoFocusClient
        onPaymentSaved={handlePaymentSaved}
      />
    </>
  )
}
