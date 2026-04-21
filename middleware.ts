import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Owner-only routes
    if (pathname.startsWith("/users") && role !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/flowers/:path*",
    "/orders/:path*",
    "/seasons/:path*",
    "/alerts/:path*",
    "/users/:path*",
  ],
};
