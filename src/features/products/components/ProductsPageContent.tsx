"use client"

import { useCallback, useMemo, useState } from "react"
import { useSWRConfig } from "swr"
import PageLayout from "@/components/shared/PageLayout"
import AddButton from "@/components/ui/AddButton"
import { LocalSaleIcon } from "@/components/ui/icons/LocalSaleIcon"
import { MarketSaleIcon } from "@/components/ui/icons/MarketSaleIcon"
import PaymentFormModal from "@/features/payments/components/PaymentFormModal"
import {
  isProductsKey,
  useProducts,
} from "@/features/products/hooks/useProducts"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import type { Product } from "@/lib/domain/entities/product"
import ProductFormModal from "./ProductFormModal"
import ProductsSearch from "./ProductsSearch"
import ProductsTable from "./ProductsTable"
import {
  buildSalePaymentFormData,
  type SalePaymentTag,
} from "./productPayment-utils"

const TODAY = new Date().toISOString().split("T")[0]
const headerActionButtonClass =
  "inline-flex min-h-11 min-w-11 items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"

function buildSelectedProducts(products: Product[], selectedIds: string[]) {
  const selectedSet = new Set(selectedIds)
  return products.filter((product) => selectedSet.has(product._id ?? ""))
}

export default function ProductsPageContent() {
  const [search, setSearch] = useState("")
  const { products, isLoading } = useProducts({ search })
  const { mutate } = useSWRConfig()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [saleTag, setSaleTag] = useState<SalePaymentTag | null>(null)

  const selectedProducts = useMemo(
    () => buildSelectedProducts(products, selectedProductIds),
    [products, selectedProductIds]
  )

  const editingProduct = useMemo(
    () => products.find((product) => product._id === editingProductId),
    [editingProductId, products]
  )

  const salePaymentInitialData: PaymentFormData | undefined = useMemo(() => {
    if (!saleTag || selectedProducts.length === 0) return undefined
    return buildSalePaymentFormData(selectedProducts, saleTag, TODAY)
  }, [saleTag, selectedProducts])

  const toggleSelectedProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const handleCreateProduct = () => {
    setEditingProductId(null)
    setSaleTag(null)
    setShowCreateModal(true)
  }

  const handleSearch = useCallback((query: string) => {
    setSearch(query)
    setSelectedProductIds([])
  }, [])

  const handleEditProduct = (productId: string) => {
    setShowCreateModal(false)
    setSaleTag(null)
    setEditingProductId(productId)
  }

  const handleCloseProductModal = () => {
    setShowCreateModal(false)
    setEditingProductId(null)
  }

  const openSalePayment = useCallback(
    (tag: SalePaymentTag) => {
      if (selectedProducts.length === 0) return
      setShowCreateModal(false)
      setEditingProductId(null)
      setSaleTag(tag)
    },
    [selectedProducts.length]
  )

  const handleLocalSaleClick = useCallback(
    () => openSalePayment("LocalSale"),
    [openSalePayment]
  )

  const handleMarketSaleClick = useCallback(
    () => openSalePayment("MarketSale"),
    [openSalePayment]
  )

  const closeSalePayment = useCallback(() => setSaleTag(null), [])
  const handleSalePaymentSaved = useCallback(() => {
    setSelectedProductIds([])
    mutate(isProductsKey, undefined, { revalidate: true })
    closeSalePayment()
  }, [closeSalePayment, mutate])

  return (
    <PageLayout
      navigationSubtitle="Products"
      headerContent={
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Inventory
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Product catalog
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Keep product prices, taxes and stock in sync.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-row lg:items-center lg:justify-end">
              <ProductsSearch onSearch={handleSearch} />
              <div className="flex flex-wrap items-center gap-2">
                <AddButton
                  ariaLabel="Add product"
                  onClick={handleCreateProduct}
                />
                <button
                  type="button"
                  aria-label="Create payment with LocalSale tag"
                  title={
                    selectedProducts.length > 0
                      ? "Create payment with LocalSale"
                      : "Select one or more products first"
                  }
                  onClick={handleLocalSaleClick}
                  disabled={selectedProducts.length === 0}
                  className={headerActionButtonClass}
                >
                  <LocalSaleIcon />
                  <span>Local</span>
                </button>
                <button
                  type="button"
                  aria-label="Create payment with MarketSale tag"
                  title={
                    selectedProducts.length > 0
                      ? "Create payment with MarketSale"
                      : "Select one or more products first"
                  }
                  onClick={handleMarketSaleClick}
                  disabled={selectedProducts.length === 0}
                  className={headerActionButtonClass}
                >
                  <MarketSaleIcon />
                  <span>Market</span>
                </button>
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {selectedProductIds.length} selected
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading && products.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Loading products...
          </div>
        ) : (
          <ProductsTable
            products={products}
            selectedProductIds={selectedProductIds}
            onToggleSelected={toggleSelectedProduct}
            onEdit={handleEditProduct}
          />
        )}
      </div>

      <ProductFormModal
        isOpen={showCreateModal}
        onClose={handleCloseProductModal}
      />

      <ProductFormModal
        product={editingProduct ?? undefined}
        isOpen={!!editingProduct}
        onClose={handleCloseProductModal}
      />

      <PaymentFormModal
        isOpen={saleTag !== null}
        onClose={closeSalePayment}
        title={
          saleTag === "LocalSale"
            ? "New Local Sale Payment"
            : "New Market Sale Payment"
        }
        initialDate={TODAY}
        initialData={salePaymentInitialData}
        onPaymentSaved={handleSalePaymentSaved}
      />
    </PageLayout>
  )
}
