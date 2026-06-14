"use client"

import { useCallback, useMemo, useState } from "react"
import { useSWRConfig } from "swr"
import PageLayout from "@/components/shared/PageLayout"
import AddButton from "@/components/ui/AddButton"
import PaymentFormModal from "@/features/payments/components/PaymentFormModal"
import {
  isProductsKey,
  useProducts,
} from "@/features/products/hooks/useProducts"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import type { Product } from "@/lib/domain/entities/product"
import ProductFormModal from "./ProductFormModal"
import ProductsSaleActions from "./ProductsSaleActions"
import ProductsSearch from "./ProductsSearch"
import ProductsTable from "./ProductsTable"
import {
  buildSalePaymentFormData,
  type SalePaymentTag,
} from "./productPayment-utils"

const TODAY = new Date().toISOString().split("T")[0]

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
              <div className="flex w-full flex-nowrap items-center gap-2 lg:w-auto">
                <AddButton
                  ariaLabel="Add product"
                  onClick={handleCreateProduct}
                />
                <div className="min-w-0 flex-1">
                  <ProductsSearch onSearch={handleSearch} />
                </div>
              </div>
              <ProductsSaleActions
                selectedCount={selectedProductIds.length}
                hasSelection={selectedProducts.length > 0}
                onLocalSaleClick={handleLocalSaleClick}
                onMarketSaleClick={handleMarketSaleClick}
              />
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
