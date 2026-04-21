"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let addToast: (message: string, type: ToastType) => void = () => {};

export const toast = {
  success: (msg: string) => addToast(msg, "success"),
  error: (msg: string) => addToast(msg, "error"),
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  addToast = useCallback((message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-sm",
            t.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <p className="flex-1">{t.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
