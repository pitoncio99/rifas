// File: src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, SessionStrategy } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "admin" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Usuario y contraseña guardados en .env.local
        if (
          credentials?.username === process.env.ADMIN_USER &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Administrador" };
        }
        return null;
      },
    }),
  ],
  // Aquí ajustamos el tipo a SessionStrategy
  session: { strategy: "jwt" as SessionStrategy },
  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
