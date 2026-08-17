export interface Product {
  _id?: string
  name: string
  tag?: string
  finalPrice: number
  stock?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductFormData {
  name: string
  tag: string
  finalPrice: string
  stock: string | null
}
