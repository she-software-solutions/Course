import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

class InactiveAccount extends CredentialsSignin {
  code = "inactive";
}

const credentialsSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1),
});

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/** How often the JWT re-reads role / active status from the database. */
const REFRESH_MS = 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        if (!user.isActive) throw new InactiveAccount();
        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
      },
    }),
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && !existing.isActive) return "/login?error=inactive";
      const dbUser =
        existing ??
        (await db.user.create({
          data: { email, name: user.name ?? email.split("@")[0]!, image: user.image },
        }));
      user.id = dbUser.id;
      user.role = dbUser.role;
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.refreshedAt = Date.now();
      }
      const stale = !token.refreshedAt || Date.now() - (token.refreshedAt as number) > REFRESH_MS;
      if (token.id && (stale || trigger === "update")) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true, name: true, image: true },
        });
        if (!fresh || !fresh.isActive) return null; // forces sign-out
        token.role = fresh.role;
        token.name = fresh.name;
        token.picture = fresh.image;
        token.refreshedAt = Date.now();
      }
      return token;
    },
  },
});
