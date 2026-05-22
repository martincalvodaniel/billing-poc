import "server-only"

import { cache } from "react"
import { MongoClientRepository } from "@/lib/adapters/repositories/mongo-client-repository"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"

const clientRepo = new MongoClientRepository()
const eventRepo = new MongoEventRepository()
const paymentRepo = new MongoPaymentRepository()

export const getClientById = cache((id: string) => clientRepo.findById(id))
export const getEventById = cache((id: string) => eventRepo.findById(id))
export const getPaymentById = cache((id: string) => paymentRepo.findById(id))
