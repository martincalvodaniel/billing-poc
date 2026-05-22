"use client"

import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { fetcher, shouldRetryOnError } from "@/lib/swr-fetcher"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 2000,
        keepPreviousData: true,
        shouldRetryOnError,
      }}
    >
      {children}
    </SWRConfig>
  )
}
