import "server-only"

import { NextResponse } from "next/server"

export function buildInlinePdfResponse(
  pdf: Uint8Array,
  filename: string
): NextResponse {
  const body = new Uint8Array(pdf.byteLength)
  body.set(pdf)
  return new NextResponse(body.buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  })
}
