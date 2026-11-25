import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Auth.js wraps the request and runs the `authorized` callback in authConfig.
const handler = auth as unknown as (req: NextRequest, ev: NextFetchEvent) => Promise<Response | undefined>;

/**
 * Role-based route protection (Next.js 16 "proxy", formerly middleware).
 * Fine-grained ownership checks happen again in every page and server action.
 */
export default function proxy(req: NextRequest, ev: NextFetchEvent) {
  return handler(req, ev);
}

export const config = {
  matcher: ["/admin/:path*", "/tutor/:path*", "/dashboard/:path*", "/learn/:path*"],
};
