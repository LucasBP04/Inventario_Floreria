import { NextRequest } from "next/server";
import { addDays } from "date-fns";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, createAuditLog } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { BatchSchema } from "@/lib/validations";

/**
 * GET /api/inventory
 * Returns all batches with computed remaining stock and freshness.
 */
export async function GET(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const flowerId = searchParams.get("flowerId");

  const batches = await prisma.flowerBatch.findMany({
    where: flowerId ? { flowerId } : undefined,
    include: {
      flower: { select: { id: true, name: true, bouquetSize: true } },
      movements: { select: { type: true, quantity: true } },
    },
    orderBy: { expiresAt: "asc" },
  });

  // Compute remaining stock per batch (work in UNITS)
  const enriched = batches.map((b) => {
    const bouquetSize = b.flower?.bouquetSize ?? 1;
    const totalUnits = b.quantity * bouquetSize;
    const consumedUnits = b.movements
      .filter((m) => m.type === "OUT" || m.type === "WASTE")
      .reduce((acc, m) => acc + m.quantity, 0);
    const remainingUnits = Math.max(0, totalUnits - consumedUnits);
    const remainingBouquets = Math.floor(remainingUnits / bouquetSize);

    const now = new Date();
    const expires = new Date(b.expiresAt);
    const daysLeft = Math.ceil(
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const freshness =
      daysLeft < 0 ? "expired" : daysLeft < 2 ? "expiring" : "fresh";

    return {
      ...b,
      movements: undefined,
      totalUnits,
      remainingUnits,
      remainingBouquets,
      daysLeft,
      freshness,
    };
  });

  return apiSuccess(enriched);
}

/**
 * POST /api/inventory
 * Register incoming stock batch from supplier.
 */
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await req.json();
  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const { flowerId, quantity, supplier, receivedAt, notes } = parsed.data;
  const received = receivedAt ? new Date(receivedAt) : new Date();
  const expiresAt = addDays(received, 7);

  const batch = await prisma.$transaction(async (tx) => {
    const flower = await tx.flower.findUnique({ where: { id: flowerId } });
    if (!flower) throw new Error("Flor no encontrada");

    const newBatch = await tx.flowerBatch.create({
      data: { flowerId, quantity, supplier, receivedAt: received, expiresAt, notes },
    });

    // Store stock movements in UNITS (quantity * bouquetSize)
    await tx.stockMovement.create({
      data: {
        batchId: newBatch.id,
        type: "IN",
        quantity: quantity * flower.bouquetSize,
        userId: session!.user.id,
      },
    });

    return newBatch;
  });

  await createAuditLog({
    userId: session!.user.id,
    action: "ADD_STOCK",
    entity: "FlowerBatch",
    entityId: batch.id,
    details: { flowerId, quantity, supplier },
  });

  return apiSuccess(batch, 201);
}
