import { Suspense } from "react"
import AbsencesPageContent from "./components/AbsencesPageContent"

function AbsencesPageLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-8 py-12">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </main>
    </div>
  )
}

export default function AbsencesPage() {
  return (
    <Suspense fallback={<AbsencesPageLoading />}>
      <AbsencesPageContent />
    </Suspense>
  )
}
