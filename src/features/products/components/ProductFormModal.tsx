"use client"

import { Modal } from "@/components/ui/Modal"
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/features/products/hooks/useProductMutations"
import type { Product, ProductFormData } from "@/lib/domain/entities/product"
import ProductForm from "./ProductForm"
import { extractProductApiError } from "./product-utils"

interface ProductFormModalProps {
  product?: Product
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ProductFormModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductFormModalProps) {
  const { trigger: createProduct } = useCreateProduct()
  const { trigger: updateProduct } = useUpdateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (product?._id) {
        await updateProduct({ id: product._id, ...data })
      } else {
        await createProduct(data)
      }
    } catch (err) {
      throw new Error(extractProductApiError(err, "Failed to save product"))
    }
    onClose()
    onSuccess?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "Edit Product" : "Create Product"}
      maxWidth="lg"
    >
      <ProductForm
        key={product?._id ?? "new"}
        product={product}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}
