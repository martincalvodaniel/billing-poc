import type { Product } from "../entities/product"

export interface ProductFilter {
  search?: string
}

export interface ProductRepository {
  findAll(filter?: ProductFilter): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  create(product: Omit<Product, "_id">): Promise<string>
  update(id: string, data: Partial<Omit<Product, "_id">>): Promise<boolean>
  adjustStock(id: string, delta: number): Promise<boolean>
  delete(id: string): Promise<boolean>
}
