import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { SeasonSchema } from "@/lib/validations";

export async function GET(_req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const seasons = await prisma.season.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return apiSuccess(seasons);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (session!.user.role !== "OWNER") return apiError("Sin permiso", 403);

  const body = await req.json();
  const parsed = SeasonSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const season = await prisma.season.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  return apiSuccess(season, 201);
}
