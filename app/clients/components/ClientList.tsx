"use client";

import { useState, useEffect } from "react";
import { Client, ClientFormData } from "@/lib/types";
import ClientForm from "./ClientForm";

interface ClientListProps {
  clients: Client[];
  onRefresh: () => Promise<void>;
}

export default function ClientList({ clients, onRefresh }: ClientListProps) {
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (clientId: string) => {
    setEditingClientId(clientId);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setError(null);
  };

  const handleUpdate = async (data: ClientFormData) => {
    try {
      const response = await fetch("/api/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingClientId, ...data }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update client");
      }

      setEditingClientId(null);
      await onRefresh();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteClick = (clientId: string) => {
    setDeletingClientId(clientId);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingClientId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete client");
      }

      setDeletingClientId(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Handle ESC key for edit modal
  useEffect(() => {
    if (!editingClientId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalElement = document.querySelector('[id="edit-client-modal"]');
      if (!modalElement) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancelEdit();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingClientId]);

  // Handle ESC key for delete modal
  useEffect(() => {
    if (!deletingClientId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalElement = document.querySelector('[id="delete-client-modal"]');
      if (!modalElement) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setDeletingClientId(null);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [deletingClientId]);

  const getClientType = (type: string) => {
    return type === "individual" ? "Person / Freelancer" : "Company";
  };

  const editingClient = clients.find((c) => c._id?.toString() === editingClientId);

  return (
    <>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {editingClientId && editingClient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelEdit();
          }}
        >
          <div 
            id="edit-client-modal"
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-lg dark:bg-zinc-900"
            role="dialog"
            aria-labelledby="edit-client-title"
            aria-modal="true"
          >
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 
                id="edit-client-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Edit Client
              </h2>
            </div>
            <div className="p-6">
              <ClientForm
                client={editingClient}
                onSubmit={handleUpdate}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      {deletingClientId && clients.find((c) => c._id?.toString() === deletingClientId) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingClientId(null);
          }}
        >
          <div 
            id="delete-client-modal"
            className="w-full max-w-sm rounded-lg bg-white shadow-lg dark:bg-zinc-900"
            role="dialog"
            aria-labelledby="delete-client-title"
            aria-modal="true"
          >
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 
                id="delete-client-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Delete Client
              </h2>
            </div>
            <div className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
              <p>Are you sure you want to delete this client?</p>
              {clients.find((c) => c._id?.toString() === deletingClientId) && (
                <div className="mt-4 space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                  <p>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Name: </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {clients.find((c) => c._id?.toString() === deletingClientId)?.name}
                    </span>
                  </p>
                  <p>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tax ID: </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {clients.find((c) => c._id?.toString() === deletingClientId)?.taxId}
                    </span>
                  </p>
                </div>
              )}
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => setDeletingClientId(null)}
                className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
            <p className="text-zinc-600 dark:text-zinc-400">No clients found. Create your first client to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Tax ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Address
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr
                    key={client._id?.toString()}
                    onClick={() => handleEdit(client._id!.toString())}
                    className={`border-b border-zinc-200 cursor-pointer transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-800/50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {client.taxId}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {getClientType(client.clientType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {client.address}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(client._id!.toString());
                        }}
                        className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 dark:focus:ring-offset-zinc-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
