import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, createAuditLog } from "@/lib/utils";
import { requireAuth } from "@/lib/session";

/**
 * DELETE /api/inventory/[id]
 * Deletes a flower batch and all its related movements and waste logs.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const batch = await prisma.flowerBatch.findUnique({
    where: { id: params.id },
  });
  if (!batch) return apiError("Lote no encontrado", 404);

  // Delete related records first (MongoDB doesn't cascade)
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { batchId: params.id } }),
    prisma.wasteLog.deleteMany({ where: { batchId: params.id } }),
    prisma.flowerBatch.delete({ where: { id: params.id } }),
  ]);

  await createAuditLog({
    userId: session!.user.id,
    action: "DELETE_BATCH",
    entity: "FlowerBatch",
    entityId: params.id,
    details: { flowerId: batch.flowerId, quantity: batch.quantity },
  });

  return apiSuccess({ ok: true });
}
