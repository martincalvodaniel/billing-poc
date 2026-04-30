import NavigationBar from "./NavigationBar"

interface PageLayoutProps {
  navigationSubtitle: string
  children: React.ReactNode
  headerContent?: React.ReactNode
}

/**
 * Shared layout component for all main pages.
 * Enforces consistent structure: outer container, main wrapper, navigation.
 * Use headerContent prop for page-specific content between nav and main content.
 */
export default function PageLayout({
  navigationSubtitle,
  children,
  headerContent,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-2 py-0 sm:space-y-4 sm:py-8">
        <NavigationBar subtitle={navigationSubtitle} />

        {headerContent}

        {children}
      </main>
    </div>
  )
}
