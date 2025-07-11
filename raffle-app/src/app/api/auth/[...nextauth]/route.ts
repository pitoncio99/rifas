// File: src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

// Configuración de NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "tú@email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        // Aquí buscas en tu BD al usuario por email (o username)
        const db = await (await import("@/lib/mongodb")).dbPromise;
        const user = await db
          .collection("users")
          .findOne({ email: credentials.username });

        if (!user) return null;
        // Verifica la contraseña
        const isValid = await (await import("bcrypt")).compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        // Devuelve la info que quieras exponer en session.user
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // La primera vez que se emite el JWT, user existirá
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          name: session.user?.name!,
          email: session.user?.email!,
          role: token.role as "admin" | "user",
        };
      }
      return session;
    },
  },
};

// NextAuth genera internamente handlers para GET y POST
const handler = NextAuth(authOptions);

// Debes exportarlos así para que Next.js los reconozca como rutas App Router
export { handler as GET, handler as POST };
