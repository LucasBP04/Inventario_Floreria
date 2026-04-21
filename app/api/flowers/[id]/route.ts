import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { FlowerSchema } from "@/lib/validations";

// PATCH /api/flowers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (session!.user.role !== "OWNER") return apiError("Sin permiso", 403);

  const body = await req.json();
  const parsed = FlowerSchema.partial().safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const flower = await prisma.flower.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return apiSuccess(flower);
}

// DELETE /api/flowers/[id] – soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (session!.user.role !== "OWNER") return apiError("Sin permiso", 403);

  await prisma.flower.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  return apiSuccess({ ok: true });
}
