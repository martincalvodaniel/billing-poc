import "server-only"

import { cache } from "react"
import { MongoClientRepository } from "@/lib/adapters/repositories/mongo-client-repository"
import { MongoCompanyInfoRepository } from "@/lib/adapters/repositories/mongo-company-info-repository"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { withDefaults } from "@/lib/domain/services/company-info-defaults"

const clientRepo = new MongoClientRepository()
const companyInfoRepo = new MongoCompanyInfoRepository()
const eventRepo = new MongoEventRepository()
const paymentRepo = new MongoPaymentRepository()

export const getClientById = cache((id: string) => clientRepo.findById(id))
export const getEventById = cache((id: string) => eventRepo.findById(id))
export const getPaymentById = cache((id: string) => paymentRepo.findById(id))
export const getCompanyInfo = cache(async () =>
  withDefaults(await companyInfoRepo.findOne())
)
