import { ObjectId } from "mongodb";

export type PaymentType = "income" | "outcome";

export interface Payment {
  _id?: ObjectId;
  type: PaymentType;
  date: string;
  tag?: string;
  netAmount: number;
  vat: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentFormData {
  type: PaymentType;
  date: string;
  total: string;
  vat: string;
  tag?: string;
}
