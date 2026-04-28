import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, createAuditLog } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { WasteSchema } from "@/lib/validations";

/**
 * POST /api/inventory/waste
 * Register waste (expired or damaged flowers).
 */
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await req.json();
  const parsed = WasteSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const { batchId, quantity, reason } = parsed.data;

  // Verify batch exists and has enough remaining stock
  const batch = await prisma.flowerBatch.findUnique({
    where: { id: batchId },
    include: {
      movements: { select: { type: true, quantity: true } },
      flower: { select: { bouquetSize: true } },
    },
  });

  if (!batch) return apiError("Lote no encontrado", 404);

  const bouquetSize = batch.flower?.bouquetSize ?? 1;
  const totalUnits = batch.quantity * bouquetSize;
  const consumedUnits = batch.movements
    .filter((m) => m.type === "OUT" || m.type === "WASTE")
    .reduce((acc, m) => acc + m.quantity, 0);
  const remainingUnits = Math.max(0, totalUnits - consumedUnits);

  if (quantity > remainingUnits)
    return apiError("Cantidad mayor al stock disponible (en unidades)");

  await prisma.$transaction([
    prisma.wasteLog.create({
      data: { batchId, quantity, reason, createdBy: session!.user.id },
    }),
    prisma.stockMovement.create({
      data: {
        batchId,
        type: "WASTE",
        quantity,
        userId: session!.user.id,
        notes: reason,
      },
    }),
  ]);

  await createAuditLog({
    userId: session!.user.id,
    action: "REGISTER_WASTE",
    entity: "FlowerBatch",
    entityId: batchId,
    details: { quantity, reason },
  });

  const newRemainingUnits = remainingUnits - quantity;
  const removedBouquets = Math.floor(quantity / bouquetSize);
  const newRemainingBouquets = Math.floor(newRemainingUnits / bouquetSize);

  return apiSuccess({
    ok: true,
    removedBouquets,
    newRemainingUnits,
    newRemainingBouquets,
  });
}
