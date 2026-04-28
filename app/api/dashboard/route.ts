import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/utils";
import { requireAuth } from "@/lib/session";

/**
 * GET /api/dashboard
 * Returns KPI summary for the main dashboard.
 */
export async function GET(_req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const now = new Date();

  const [
    totalBatches,
    expiredBatches,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    recentMovements,
  ] = await Promise.all([
    prisma.flowerBatch.count(),
    prisma.flowerBatch.count({ where: { expiresAt: { lt: now } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        batch: { include: { flower: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    }),
  ]);

  // Total revenue (delivered orders)
  const revenueResult = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { status: "DELIVERED" },
  });

  // Active inventory summary
  const activeBatches = await prisma.flowerBatch.findMany({
    where: { expiresAt: { gte: now } },
    include: {
      flower: { select: { name: true, bouquetSize: true } },
      movements: { select: { type: true, quantity: true } },
    },
  });

  const inventorySummary = activeBatches.map((b) => {
    const bouquetSize = b.flower?.bouquetSize ?? 1;
    const totalUnits = b.quantity * bouquetSize;
    const consumedUnits = b.movements
      .filter((m) => m.type === "OUT" || m.type === "WASTE")
      .reduce((acc, m) => acc + m.quantity, 0);
    const remainingUnits = Math.max(0, totalUnits - consumedUnits);
    const remaining = Math.floor(remainingUnits / bouquetSize);
    const daysLeft = Math.ceil(
      (new Date(b.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const freshness =
      daysLeft < 0 ? "expired" : daysLeft < 2 ? "expiring" : "fresh";
    return {
      id: b.id,
      flowerName: b.flower.name,
      remaining,
      remainingUnits,
      daysLeft,
      freshness,
      expiresAt: b.expiresAt,
    };
  });

  return apiSuccess({
    kpis: {
      totalBatches,
      expiredBatches,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalRevenue: revenueResult._sum.totalPrice ?? 0,
    },
    recentMovements,
    inventorySummary,
  });
}
