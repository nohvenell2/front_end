import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      steamid: string;
      name: string;
      image: string;
      email: string;
    };
  }
  interface User {
    steamid?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      id: "steam",
      name: "Steam",
      credentials: {
        steamid: { label: "Steam ID", type: "text" },
        name: { label: "Name", type: "text" },
        image: { label: "Image", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.steamid) return null;
        return {
          id: credentials.steamid as string,
          steamid: credentials.steamid as string,
          name: credentials.name as string,
          image: credentials.image as string,
          email: "",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.steamid = user.steamid;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.steamid as string,
        email: "",
        steamid: token.steamid as string,
        name: token.name as string,
        image: token.picture as string,
      };
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
