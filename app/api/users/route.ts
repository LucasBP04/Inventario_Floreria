import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { requireOwner } from "@/lib/session";
import { UserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest) {
  const { response } = await requireOwner();
  if (response) return response;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(users);
}

export async function POST(req: NextRequest) {
  const { response } = await requireOwner();
  if (response) return response;

  const body = await req.json();
  const parsed = UserSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return apiError("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return apiSuccess(user, 201);
}
