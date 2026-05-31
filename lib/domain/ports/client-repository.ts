import type { Client, PaginatedResponse } from "../entities/client"

export interface ClientFilter {
  search?: string
  page: number
  pageSize: number
}

export type ClientUpdateData = Partial<Omit<Client, "taxId" | "address" | "phone" | "email">> & {
  taxId?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

export interface ClientRepository {
  findAll(filter: ClientFilter): Promise<PaginatedResponse<Client>>
  findById(id: string): Promise<Client | null>
  create(client: Omit<Client, "_id">): Promise<string>
  update(id: string, data: ClientUpdateData): Promise<boolean>
  delete(id: string): Promise<boolean>
  findAllNames(query?: string): Promise<string[]>
}
