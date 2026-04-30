"use client";

import { useState, useEffect, useRef } from "react";
import { Client } from "@/lib/types";

interface ClientSelectorProps {
  value?: string; // Client ID
  onChange: (clientId: string | undefined, clientName: string | undefined) => void;
  label?: string;
  required?: boolean;
}

export default function ClientSelector({
  value,
  onChange,
  label = "Client (Optional)",
  required = false,
}: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch client by ID on mount if value is provided
  useEffect(() => {
    const fetchClientById = async (clientId: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/clients?search=`);
        if (response.ok) {
          const data = await response.json();
          const client = data.items.find((c: Client) => c._id?.toString() === clientId);
          if (client) {
            setSelectedClient(client);
            setSearchQuery(client.name);
          }
        }
      } catch (err) {
        console.error(`Error fetching client: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (value && !selectedClient) {
      fetchClientById(value);
    }
  }, [value, selectedClient]);

  // Fetch clients based on search query with debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!showSuggestions) {
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        // Fetch all clients if search is empty
        setIsLoading(true);
        try {
          const response = await fetch(`/api/clients?pageSize=20`);
          if (response.ok) {
            const data = await response.json();
            setClients(data.items || []);
          }
        } catch (err) {
          console.error(`Error fetching clients: ${err}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Search for clients matching query
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/clients?search=${encodeURIComponent(searchQuery)}&pageSize=20`
          );
          if (response.ok) {
            const data = await response.json();
            setClients(data.items || []);
          }
        } catch (err) {
          console.error(`Error searching clients: ${err}`);
        } finally {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    
    // Clear selection if user is typing
    if (selectedClient) {
      setSelectedClient(null);
      onChange(undefined, undefined);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.name);
    setShowSuggestions(false);
    onChange(client._id?.toString(), client.name);
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    setSearchQuery("");
    setClients([]);
    onChange(undefined, undefined);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label
        htmlFor="client-selector"
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          id="client-selector"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search clients by name or tax ID..."
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required={required}
        />
        
        {/* Clear button */}
        {(searchQuery || selectedClient) && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected client indicator */}
      {selectedClient && (
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          <span className="font-medium">Selected:</span> {selectedClient.name} ({selectedClient.taxId})
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Loading...
            </div>
          ) : clients.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {clients.map((client) => (
                <li key={client._id?.toString()}>
                  <button
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {client.name}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {client.taxId} • {client.clientType}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim() !== "" ? (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              No clients found
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Start typing to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
