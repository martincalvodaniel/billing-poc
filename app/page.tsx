import PaymentForm from "./components/PaymentForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-4xl flex-col items-center gap-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Billing System
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Manage your income and outcome payments
          </p>
        </div>
        
        <PaymentForm />
      </main>
    </div>
  );
}
