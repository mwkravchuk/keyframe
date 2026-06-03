import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          prompt: "select_account consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/app`;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user?.id || !account || account.provider !== "google") {
        return;
      }

      const refreshToken =
        typeof account.refresh_token === "string" ? account.refresh_token : null;
      const accessToken =
        typeof account.access_token === "string" ? account.access_token : null;
      const tokenType =
        typeof account.token_type === "string" ? account.token_type : null;
      const scope = typeof account.scope === "string" ? account.scope : null;
      const idToken = typeof account.id_token === "string" ? account.id_token : null;
      const sessionState =
        typeof account.session_state === "string" ? account.session_state : null;
      const expiresAt =
        typeof account.expires_at === "number" ? account.expires_at : null;
      const refreshTokenExpiresIn =
        typeof account.refresh_token_expires_in === "number"
          ? account.refresh_token_expires_in
          : null;

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        create: {
          userId: user.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: refreshToken,
          refresh_token_expires_in: refreshTokenExpiresIn,
          access_token: accessToken,
          expires_at: expiresAt,
          token_type: tokenType,
          scope,
          id_token: idToken,
          session_state: sessionState,
        },
        update: {
          userId: user.id,
          access_token: accessToken,
          expires_at: expiresAt,
          token_type: tokenType,
          scope,
          id_token: idToken,
          session_state: sessionState,
          ...(refreshToken ? { refresh_token: refreshToken } : {}),
          ...(refreshTokenExpiresIn != null
            ? { refresh_token_expires_in: refreshTokenExpiresIn }
            : {}),
        },
      });
    },
  },
};