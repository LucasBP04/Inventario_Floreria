import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "dd MMM yyyy") {
  return format(new Date(date), fmt, { locale: es });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

// ──────────────────────────────────────────────
// Freshness helpers (7-day flower lifespan)
// ──────────────────────────────────────────────

export type FreshnessStatus = "fresh" | "expiring" | "expired";

export function getFreshnessStatus(expiresAt: Date | string): FreshnessStatus {
  const days = differenceInDays(new Date(expiresAt), new Date());
  if (days < 0) return "expired";
  if (days < 2) return "expiring";
  return "fresh";
}

export const FRESHNESS_LABEL: Record<FreshnessStatus, string> = {
  fresh: "Fresca",
  expiring: "Por vencer",
  expired: "Vencida",
};

export const FRESHNESS_CLASS: Record<FreshnessStatus, string> = {
  fresh: "bg-green-100 text-green-800",
  expiring: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
};

// ──────────────────────────────────────────────
// API helpers
// ──────────────────────────────────────────────

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

// ──────────────────────────────────────────────
// Audit helper
// ──────────────────────────────────────────────

import prisma from "./prisma";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  orderId,
  details,
}: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  orderId?: string;
  details?: object;
}) {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, orderId, details },
  });
}
