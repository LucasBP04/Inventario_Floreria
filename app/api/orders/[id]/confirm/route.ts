import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, createAuditLog } from "@/lib/utils";
import { requireAuth } from "@/lib/session";

/**
 * POST /api/orders/[id]/confirm
 * Confirms an order and auto-deducts stock from oldest batches (FIFO).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!order) return apiError("Pedido no encontrado", 404);
  if (order.status !== "PENDING")
    return apiError("El pedido ya fue procesado");

  // FIFO stock deduction per flower
  try {
    await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          // Work in UNITS: convert ordered bouquets to units
          const flower = await tx.flower.findUnique({
            where: { id: item.flowerId },
            select: { bouquetSize: true, name: true },
          });
          const bouquetSize = flower?.bouquetSize ?? 1;
          // If the order item specifies `units`, use it directly. Otherwise assume `quantity` is bouquets.
          const itemUnits = (item as any).units;
          let needed = itemUnits != null ? itemUnits : item.quantity * bouquetSize; // units needed

          // Fetch available batches for this flower FIFO (oldest expiresAt first)
          const batches = await tx.flowerBatch.findMany({
            where: { flowerId: item.flowerId },
            include: { movements: { select: { type: true, quantity: true } } },
            orderBy: { expiresAt: "asc" },
          });

          for (const batch of batches) {
            if (needed <= 0) break;

            const consumedUnits = batch.movements
              .filter((m) => m.type === "OUT" || m.type === "WASTE")
              .reduce((acc, m) => acc + m.quantity, 0);
            const availableUnits = batch.quantity * bouquetSize - consumedUnits;

            if (availableUnits <= 0) continue;

            const deduct = Math.min(needed, availableUnits);
            needed -= deduct;

            await tx.stockMovement.create({
              data: {
                batchId: batch.id,
                type: "OUT",
                quantity: deduct,
                orderId: order.id,
                userId: session!.user.id,
              },
            });
          }

          if (needed > 0) {
            const faltanUnits = needed;
            const faltanBouquets = Math.ceil(faltanUnits / bouquetSize);
            const flowerName = flower?.name ?? item.flowerId;
            const message = `Stock insuficiente para ${flowerName}: faltan ${faltanBouquets} ramos (${faltanUnits} unidades)`;
            throw new Error(message);
          }
        }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
      });
    });
  } catch (err: any) {
    return apiError(err.message ?? "Error al confirmar pedido");
  }

  await createAuditLog({
    userId: session!.user.id,
    action: "CONFIRM_ORDER",
    entity: "Order",
    entityId: order.id,
    orderId: order.id,
  });

  return apiSuccess({ ok: true });
}
