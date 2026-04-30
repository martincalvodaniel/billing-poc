"use client";

import { useCallback, useEffect, useState } from "react";
import PageLayout from "@/app/components/PageLayout";
import type { Client, ClientFormData } from "@/lib/types";
import ClientForm from "./components/ClientForm";
import ClientList from "./components/ClientList";
import ClientSearch from "./components/ClientSearch";
import PaginationControls from "./components/PaginationControls";

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export default function ClientsPage() {
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (query?: string, pageNum?: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL("/api/clients", window.location.origin);
      if (query) {
        url.searchParams.set("search", query);
      }
      url.searchParams.set("page", String(pageNum ?? 1));
      url.searchParams.set("pageSize", String(10));

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data = await response.json();
      setFilteredClients(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchClients(query, 1); // Reset to page 1 on search
    },
    [fetchClients],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchClients(searchQuery, newPage);
    },
    [fetchClients, searchQuery],
  );

  const handleCreateClient = async (data: ClientFormData) => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to create client");
    }

    setShowForm(false);
    await fetchClients(searchQuery, 1); // Reset to page 1 after create
  };

  const handleRefresh = async () => {
    await fetchClients(searchQuery, pagination.page);
  };

  return (
    <PageLayout
      title="Clients"
      subtitle="Manage your business contacts and client information"
      navigationSubtitle="Clients"
    >
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <ClientSearch onSearch={handleSearch} />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            {showForm ? "Cancel" : "Add Client"}
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Create New Client
            </h3>
            <ClientForm onSubmit={handleCreateClient} onCancel={() => setShowForm(false)} />
          </div>
        )}
      </div>

      {isLoading && filteredClients.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-zinc-600 dark:text-zinc-400">Loading clients...</p>
        </div>
      ) : (
        <>
          <ClientList clients={filteredClients} onRefresh={handleRefresh} />

          {pagination.total > 0 && (
            <div className="flex justify-center">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                pageSize={pagination.pageSize}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={pagination.hasNextPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
