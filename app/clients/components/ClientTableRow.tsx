"use client"

import type { Client } from "@/lib/types"

interface ClientTableRowProps {
  client: Client
  index: number
  onEdit: (clientId: string) => void
  onDelete: (clientId: string) => void
}

function getClientType(type: string): string {
  return type === "individual" ? "Person / Freelancer" : "Company"
}

export default function ClientTableRow({
  client,
  index,
  onEdit,
  onDelete,
}: ClientTableRowProps) {
  const clientId = client._id?.toString() ?? ""
  const stripe =
    index % 2 === 0
      ? "bg-white dark:bg-zinc-900"
      : "bg-zinc-50 dark:bg-zinc-800/50"
  return (
    <tr
      onClick={() => onEdit(clientId)}
      className={`border-b border-zinc-200 cursor-pointer transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20 ${stripe}`}
    >
      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
        {client.name}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
        {client.taxId || "—"}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
        {getClientType(client.clientType)}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
        {client.address || "—"}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(clientId)
          }}
          className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 dark:focus:ring-offset-zinc-900"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
