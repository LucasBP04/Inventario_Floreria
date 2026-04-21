import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, createAuditLog } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { OrderSchema } from "@/lib/validations";

/**
 * GET /api/orders
 * Returns orders with optional filters: status, from, to, channel
 */
export async function GET(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as string | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const channel = searchParams.get("channel");

  const orders = await prisma.order.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(channel && { channel: channel as any }),
      ...(from || to
        ? {
            deliveryDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: {
      items: { include: { flower: { select: { name: true } } } },
      season: { select: { name: true, multiplier: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(orders);
}

/**
 * POST /api/orders
 * Create a new order. Does NOT auto-deduct stock (happens on CONFIRM).
 */
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await req.json();
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const { items, ...orderData } = parsed.data;

  const totalPrice = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );

  const order = await prisma.order.create({
    data: {
      ...orderData,
      deliveryDate: new Date(orderData.deliveryDate),
      totalPrice,
      createdById: session!.user.id,
      items: {
        create: items.map((i) => ({
          flowerId: i.flowerId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  await createAuditLog({
    userId: session!.user.id,
    action: "CREATE_ORDER",
    entity: "Order",
    entityId: order.id,
    orderId: order.id,
    details: { customerName: order.customerName, totalPrice },
  });

  return apiSuccess(order, 201);
}
