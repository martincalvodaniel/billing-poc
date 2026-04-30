import type { Client, PaginatedResponse } from "../entities/client"

export interface ClientFilter {
  search?: string
  page: number
  pageSize: number
}

export interface ClientRepository {
  findAll(filter: ClientFilter): Promise<PaginatedResponse<Client>>
  findById(id: string): Promise<Client | null>
  create(client: Omit<Client, "_id">): Promise<string>
  update(id: string, data: Partial<Client>): Promise<boolean>
  delete(id: string): Promise<boolean>
}
