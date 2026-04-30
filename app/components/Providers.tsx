"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { fetcher, shouldRetryOnError } from "@/lib/swr-fetcher"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  )
}
