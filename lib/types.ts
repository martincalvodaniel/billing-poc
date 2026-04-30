import { ObjectId } from "mongodb";

export type PaymentType = "income" | "outcome";

export interface PaymentConcept {
  name?: string;
  amount: number;
  vat?: number; // Optional concept-level VAT override (as percentage)
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
