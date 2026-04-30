"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  closeOnEscape?: boolean;
  closeOnEnter?: boolean;
  closeOnBackdropClick?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
  closeOnEscape = true,
  closeOnEnter = false,
  closeOnBackdropClick = true,
}: ModalProps) {
  // Handle ESC key and optional ENTER key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalElement = document.querySelector('[role="dialog"]');
      if (!modalElement) return;

      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "Enter" && closeOnEnter) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEscape, closeOnEnter]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`${maxWidthClass} w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-lg dark:bg-zinc-900`}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 id="modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
