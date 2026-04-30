import { ObjectId } from "mongodb";

export type PaymentType = "income" | "outcome";

export type ClientType = "individual" | "company";

export interface PaymentConcept {
  name: string;
  amount: number;
  quantity: number;
}

export interface Payment {
  _id?: ObjectId;
  type: PaymentType;
  date: string;
  tag?: string;
  clientId?: ObjectId;
  concepts: PaymentConcept[];
  vat: number;
  surcharge?: number;
  deliveryNoteRef?: string;
  netAmount: number;
  vatAmount: number;
  surchargeAmount?: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentFormData {
  type: PaymentType;
  date: string;
  concepts: PaymentConcept[];
  vat: string;
  surcharge?: string;
  tag?: string;
  clientId?: string;
  deliveryNoteRef?: string;
}

export interface Client {
  _id?: ObjectId;
  clientType: ClientType;
  name: string;
  taxId: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  clientType: ClientType;
  name: string;
  taxId: string;
  address: string;
  phone?: string;
  email?: string;
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
