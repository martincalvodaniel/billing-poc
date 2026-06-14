export interface Product {
  _id?: string
  name: string
  finalPrice: number
  taxes: number
  stock: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductFormData {
  name: string
  finalPrice: string
  taxes: string
  stock: string
}
