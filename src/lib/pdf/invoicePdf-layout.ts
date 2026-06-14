import "server-only"

import { rgb } from "pdf-lib"
import type { InvoiceType } from "@/lib/domain/entities/payment"

/** PDF rendering applies only to the four generated invoice types;
 *  `Receipt` is link-only and never renders here. */
export type GeneratedInvoiceType = Exclude<InvoiceType, "Receipt">

export const PAGE_WIDTH = 595
export const PAGE_HEIGHT = 842
export const MARGIN = 50
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const COL_GAP = 16
export const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2
export const RIGHT_X = MARGIN + COL_WIDTH + COL_GAP
export const BAND_HEIGHT = 18
export const ROW_HEIGHT = 14
export const LOGO_BOX = 70
export const LOGO_CLEARANCE = 20

export const HEADER_BG = rgb(0xe4 / 255, 0xeb / 255, 0xd4 / 255)
export const TOTAL_BG = rgb(0x74 / 255, 0x8f / 255, 0x4a / 255)
export const SAGE_TEXT = rgb(0x6b / 255, 0x7a / 255, 0x4e / 255)
export const BLACK = rgb(0, 0, 0)
export const WHITE = rgb(1, 1, 1)
