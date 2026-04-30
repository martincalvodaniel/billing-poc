import { ObjectId } from "mongodb";

export type PaymentType = "income" | "outcome";

export type ClientType = "individual" | "company";

export interface PaymentConcept {
  name: string;
  amount: number;
  quantity: number; // Quantity/multiplier for the concept (1 or more)
}

export interface Payment {
  _id?: ObjectId;
  type: PaymentType;
  date: string;
  tag?: string;
  concepts: PaymentConcept[]; // Array of line items/concepts
  vat: number; // Default VAT percentage applied to payment
  netAmount: number;
  vatAmount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentFormData {
  type: PaymentType;
  date: string;
  concepts: PaymentConcept[];
  vat: string;
  tag?: string;
}

export interface Client {
  _id?: ObjectId;
  clientType: ClientType; // "individual" for persons/freelancers, "company" for businesses
  name: string; // Nombre y Apellidos (individual) or Razón Social (company)
  taxId: string; // NIF/CIF/NIE (Tax ID)
  address: string; // Domicilio Fiscal (full address with postal code and city)
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  clientType: ClientType;
  name: string;
  taxId: string;
  address: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
