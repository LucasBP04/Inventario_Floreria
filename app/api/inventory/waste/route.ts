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
    include: { movements: { select: { type: true, quantity: true } } },
  });

  if (!batch) return apiError("Lote no encontrado", 404);

  const consumed = batch.movements
    .filter((m) => m.type === "OUT" || m.type === "WASTE")
    .reduce((acc, m) => acc + m.quantity, 0);
  const remaining = batch.quantity - consumed;

  if (quantity > remaining) return apiError("Cantidad mayor al stock disponible");

  await prisma.$transaction([
    prisma.wasteLog.create({
      data: { batchId, quantity, reason, createdBy: session!.user.id },
    }),
    prisma.stockMovement.create({
      data: { batchId, type: "WASTE", quantity, userId: session!.user.id, notes: reason },
    }),
  ]);

  await createAuditLog({
    userId: session!.user.id,
    action: "REGISTER_WASTE",
    entity: "FlowerBatch",
    entityId: batchId,
    details: { quantity, reason },
  });

  return apiSuccess({ ok: true });
}
