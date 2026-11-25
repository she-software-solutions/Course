import type { NextAuthConfig } from "next-auth";

type Role = "LEARNER" | "TUTOR" | "ADMIN";

/** Which roles may open which area. Admins can access everything. */
const areaRoles: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/tutor", roles: ["TUTOR", "ADMIN"] },
  { prefix: "/dashboard", roles: ["LEARNER", "TUTOR", "ADMIN"] },
  { prefix: "/learn", roles: ["LEARNER", "TUTOR", "ADMIN"] },
];

/**
 * Edge-safe Auth.js config (no database access) — shared by the proxy
 * and the full server config in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;
      const area = areaRoles.find((a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"));
      if (!area) return true;

      const user = auth?.user;
      if (!user) {
        const url = new URL("/login", request.nextUrl);
        url.searchParams.set("callbackUrl", pathname + search);
        return Response.redirect(url);
      }
      if (!area.roles.includes(user.role as Role)) {
        return Response.redirect(new URL("/unauthorized", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        if (token.name) session.user.name = token.name;
        if (token.picture !== undefined) session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
