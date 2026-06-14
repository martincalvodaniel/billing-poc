import type { Product } from "../entities/product"

export interface ProductRepository {
  findAll(): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  create(product: Omit<Product, "_id">): Promise<string>
  update(id: string, data: Partial<Omit<Product, "_id">>): Promise<boolean>
  delete(id: string): Promise<boolean>
}
