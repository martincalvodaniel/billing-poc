import type { Product } from "../entities/product"

export type ProductUpdateData = Omit<Partial<Omit<Product, "_id">>, "stock"> & {
  stock?: number | null
}

export interface ProductFilter {
  search?: string
  tags?: string[]
}

export interface ProductRepository {
  findAll(filter?: ProductFilter): Promise<Product[]>
  findDistinctTags(): Promise<string[]>
  findById(id: string): Promise<Product | null>
  create(product: Omit<Product, "_id">): Promise<string>
  update(id: string, data: ProductUpdateData): Promise<boolean>
  adjustStock(id: string, delta: number): Promise<boolean>
  delete(id: string): Promise<boolean>
}
