"use client"

import { useCallback, useMemo, useState } from "react"
import { useSWRConfig } from "swr"
import PageLayout from "@/components/shared/PageLayout"
import AddButton from "@/components/ui/AddButton"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import PaymentFormModal from "@/features/payments/components/PaymentFormModal"
import { useDeleteProduct } from "@/features/products/hooks/useProductMutations"
import {
  isProductsKey,
  useProducts,
} from "@/features/products/hooks/useProducts"
import { useProductTags } from "@/features/products/hooks/useProductTags"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import type { Product } from "@/lib/domain/entities/product"
import { formatCurrency } from "@/lib/utils/formatters"
import ProductFormModal from "./ProductFormModal"
import ProductsSaleActions from "./ProductsSaleActions"
import ProductsSearch from "./ProductsSearch"
import ProductsTable from "./ProductsTable"
import ProductTagFilters from "./ProductTagFilters"
import {
  DEFAULT_PRODUCT_SORT,
  nextProductSortState,
  type ProductSortKey,
  type ProductSortState,
  sortProducts,
} from "./product-sort-utils"
import { extractProductApiError } from "./product-utils"
import {
  buildSalePaymentFormData,
  type SalePaymentTag,
} from "./productPayment-utils"

const TODAY = new Date().toISOString().split("T")[0]

export default function ProductsPageContent() {
  const [search, setSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { products, isLoading } = useProducts({ search, tags: selectedTags })
  const { tags: availableTags } = useProductTags()
  const { mutate } = useSWRConfig()
  const { trigger: deleteProduct, isMutating: isDeletingProduct } =
    useDeleteProduct()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [selectedProductsById, setSelectedProductsById] = useState<
    Record<string, Product>
  >({})
  const [saleTag, setSaleTag] = useState<SalePaymentTag | null>(null)
  const [sortState, setSortState] =
    useState<ProductSortState>(DEFAULT_PRODUCT_SORT)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const sortedProducts = useMemo(
    () => sortProducts(products, sortState),
    [products, sortState]
  )

  const selectedProducts = useMemo(
    () =>
      selectedProductIds
        .map((productId) => selectedProductsById[productId])
        .filter((product): product is Product => product !== undefined),
    [selectedProductIds, selectedProductsById]
  )

  const editingProduct = useMemo(
    () => products.find((product) => product._id === editingProductId),
    [editingProductId, products]
  )
  const deletingProduct = useMemo(
    () => products.find((product) => product._id === deletingProductId),
    [deletingProductId, products]
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
    setSelectedProductsById((prev) => {
      if (prev[productId]) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      const product = products.find((item) => item._id === productId)
      if (!product) return prev
      return { ...prev, [productId]: product }
    })
  }

  const handleCreateProduct = () => {
    setEditingProductId(null)
    setSaleTag(null)
    setShowCreateModal(true)
  }

  const handleSortChange = useCallback((sortKey: ProductSortKey) => {
    setSortState((current) => nextProductSortState(current, sortKey))
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearch(query)
  }, [])

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((value) => value !== tag)
        : [...prev, tag]
    )
  }, [])

  const handleClearTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  const handleEditProduct = (productId: string) => {
    setShowCreateModal(false)
    setSaleTag(null)
    setDeletingProductId(null)
    setDeleteError(null)
    setEditingProductId(productId)
  }

  const handleDeleteProduct = useCallback((productId: string) => {
    setShowCreateModal(false)
    setSaleTag(null)
    setEditingProductId(null)
    setDeletingProductId(productId)
    setDeleteError(null)
  }, [])

  const handleCloseProductModal = () => {
    setShowCreateModal(false)
    setEditingProductId(null)
  }

  const handleCancelDeleteProduct = useCallback(() => {
    if (isDeletingProduct) return
    setDeletingProductId(null)
    setDeleteError(null)
  }, [isDeletingProduct])

  const handleConfirmDeleteProduct = useCallback(async () => {
    if (!deletingProductId) return
    try {
      await deleteProduct({ id: deletingProductId })
    } catch (err) {
      setDeleteError(extractProductApiError(err, "Failed to delete product"))
      return
    }
    setSelectedProductIds((prev) =>
      prev.filter((id) => id !== deletingProductId)
    )
    setSelectedProductsById((prev) => {
      if (!prev[deletingProductId]) return prev
      const next = { ...prev }
      delete next[deletingProductId]
      return next
    })
    setDeletingProductId(null)
    setDeleteError(null)
  }, [deleteProduct, deletingProductId])

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
                Keep product prices and stock in sync.
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
          <ProductTagFilters
            availableTags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={handleTagToggle}
            onClearTags={handleClearTags}
          />
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
            products={sortedProducts}
            selectedProductIds={selectedProductIds}
            sortState={sortState}
            onSortChange={handleSortChange}
            onToggleSelected={toggleSelectedProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        )}
      </div>

      <ProductFormModal
        isOpen={showCreateModal}
        onClose={handleCloseProductModal}
        availableTags={availableTags}
      />

      <ProductFormModal
        product={editingProduct ?? undefined}
        isOpen={!!editingProduct}
        onClose={handleCloseProductModal}
        availableTags={availableTags}
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

      <ConfirmDialog
        isOpen={deletingProductId !== null}
        title="Delete Product"
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={isDeletingProduct}
        error={deleteError}
        onCancel={handleCancelDeleteProduct}
        onConfirm={handleConfirmDeleteProduct}
      >
        <p>Are you sure you want to delete this product?</p>
        {deletingProduct ? (
          <div className="space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Name:{" "}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {deletingProduct.name}
              </span>
            </p>
            <p>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Final price:{" "}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(deletingProduct.finalPrice)}
              </span>
            </p>
          </div>
        ) : null}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This action cannot be undone.
        </p>
      </ConfirmDialog>
    </PageLayout>
  )
}
