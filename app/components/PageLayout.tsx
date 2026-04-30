import NavigationBar from "./NavigationBar";

interface PageLayoutProps {
  title: string;
  subtitle: string;
  navigationSubtitle: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

/**
 * Shared layout component for all main pages.
 * Enforces consistent structure: outer container, main wrapper, navigation, page header.
 * Use headerContent prop for page-specific content between header and main content (e.g., filters, selectors).
 */
export default function PageLayout({
  title,
  subtitle,
  navigationSubtitle,
  children,
  headerContent,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-8 py-12">
        <NavigationBar subtitle={navigationSubtitle} />

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </div>

        {headerContent}

        {children}
      </main>
    </div>
  );
}
