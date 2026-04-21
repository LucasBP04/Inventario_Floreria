import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { FlowerSchema } from "@/lib/validations";

// GET /api/flowers – list active flowers
export async function GET(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const flowers = await prisma.flower.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return apiSuccess(flowers);
}

// POST /api/flowers – create flower (owner only)
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (session!.user.role !== "OWNER") return apiError("Sin permiso", 403);

  const body = await req.json();
  const parsed = FlowerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const flower = await prisma.flower.create({ data: parsed.data });
  return apiSuccess(flower, 201);
}
