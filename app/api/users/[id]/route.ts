import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { requireOwner } from "@/lib/session";

// PATCH /api/users/[id] – toggle active, change role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { response } = await requireOwner();
  if (response) return response;

  const { role, isActive } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return apiSuccess(user);
}
