"use client"

import { useCallback } from "react"
import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton"
import { IconButton } from "@/components/ui/IconButton"
import { ClientTypeIcon } from "@/components/ui/icons/ClientTypeIcon"
import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import type { Client } from "@/lib/domain/entities/client"

interface ClientTableRowProps {
  client: Client
  index: number
  onEdit: (clientId: string) => void
  onDelete: (clientId: string) => void
  onCopy?: (field: string, value: string) => void
}

export default function ClientTableRow({
  client,
  index,
  onEdit,
  onDelete,
  onCopy,
}: ClientTableRowProps) {
  const handleEdit = () => onEdit(clientId)
  const handleDelete = () => onDelete(clientId)
  const clientId = client._id ?? ""
  const stripe =
    index % 2 === 0
      ? "bg-white dark:bg-zinc-900"
      : "bg-zinc-50 dark:bg-zinc-800/50"
  const typeLabel =
    client.clientType === "individual" ? "Person / Freelancer" : "Company"
  const handlePhoneCopied = useCallback(() => {
    onCopy?.("phone", client.phone ?? "")
  }, [client.phone, onCopy])
  const handleEmailCopied = useCallback(() => {
    onCopy?.("email", client.email ?? "")
  }, [client.email, onCopy])
  return (
    <tr
      onClick={handleEdit}
      className={`border-b border-zinc-200 cursor-pointer transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20 ${stripe}`}
    >
      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
        <span className="inline-flex items-center gap-2">
          <ClientTypeIcon
            type={client.clientType}
            className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
          />
          <span title={typeLabel}>{client.name}</span>
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
        {client.taxId || "—"}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
        {client.phone ? (
          <CopyToClipboardButton
            value={client.phone}
            title={client.phone}
            ariaLabel={`Copy phone ${client.phone}`}
            className="rounded px-1 py-0.5 text-left hover:bg-zinc-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-zinc-700/60"
            showIcon={false}
            stopPropagation
            onCopied={handlePhoneCopied}
          >
            {client.phone}
          </CopyToClipboardButton>
        ) : (
          "—"
        )}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
        {client.email ? (
          <CopyToClipboardButton
            value={client.email}
            title={client.email}
            ariaLabel={`Copy email ${client.email}`}
            className="rounded px-1 py-0.5 text-left hover:bg-zinc-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-zinc-700/60"
            showIcon={false}
            stopPropagation
            onCopied={handleEmailCopied}
          >
            {client.email}
          </CopyToClipboardButton>
        ) : (
          "—"
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <IconButton
          variant="danger"
          stopPropagation
          onClick={handleDelete}
          ariaLabel={`Delete client ${client.name}`}
        >
          <TrashIcon />
        </IconButton>
      </td>
    </tr>
  )
}
