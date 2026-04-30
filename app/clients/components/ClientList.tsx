"use client";

import { useState } from "react";
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
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Edit Client
          </h3>
          <ClientForm
            client={editingClient}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {deletingClientId && clients.find((c) => c._id?.toString() === deletingClientId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete Client
            </h2>
            <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {clients.find((c) => c._id?.toString() === deletingClientId)?.name}
                </span>
              </p>
              <p>
                Tax ID:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {clients.find((c) => c._id?.toString() === deletingClientId)?.taxId}
                </span>
              </p>
            </div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeletingClientId(null)}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
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
                    className={`border-b border-zinc-200 dark:border-zinc-700 ${
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
                        onClick={() => handleEdit(client._id!.toString())}
                        className="mr-2 rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:focus:ring-offset-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(client._id!.toString())}
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
