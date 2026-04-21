import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, createAuditLog } from "@/lib/utils";
import { requireAuth } from "@/lib/session";

// PATCH /api/orders/[id] – update status (DELIVERED / CANCELLED)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await req.json();
  const { status } = body;

  if (!["DELIVERED", "CANCELLED"].includes(status))
    return apiError("Estado inválido");

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status },
  });

  await createAuditLog({
    userId: session!.user.id,
    action: `UPDATE_ORDER_${status}`,
    entity: "Order",
    entityId: order.id,
    orderId: order.id,
  });

  return apiSuccess(order);
}

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAuth();
  if (response) return response;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { flower: true } },
      season: true,
      createdBy: { select: { name: true, email: true } },
      auditLogs: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) return apiError("Pedido no encontrado", 404);
  return apiSuccess(order);
}
