import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { apiError } from "./utils";

/** Returns session or a 401 Response. Call-site must check the discriminant. */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, response: apiError("No autenticado", 401) };
  }
  return { session, response: null };
}

export async function requireOwner() {
  const { session, response } = await requireAuth();
  if (response) return { session: null, response };
  if (session!.user.role !== "OWNER") {
    return { session: null, response: apiError("Sin permiso", 403) };
  }
  return { session, response: null };
}
