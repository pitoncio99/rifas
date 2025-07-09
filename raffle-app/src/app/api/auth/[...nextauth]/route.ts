// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { dbPromise } from "@/lib/mongodb";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  // Firma de los JWTs y cookies
  secret: process.env.NEXTAUTH_SECRET,

  // Usamos JWT en vez de sessions en DB
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        identifier: {
          label: "Email o nombre",
          type: "text",
          placeholder: "usuario@ejemplo.com o nombre",
        },
        password: {
          label: "Contraseña",
          type: "password",
          placeholder: "••••••••",
        },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        // Conectamos a MongoDB
        const db   = await dbPromise;
        const col  = db.collection<{
          _id: string;
          name: string;
          email: string;
          password: string;
          role: "admin" | "user";
        }>("users");

        // Buscamos usuario por email o por name
        const user = await col.findOne({
          $or: [
            { email: credentials.identifier.toLowerCase() },
            { name:  credentials.identifier }
          ]
        });
        if (!user) return null;

        // Comparamos la contraseña con el hash en DB
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        // Lo que terminará en el JWT
        return {
          id:   user._id,
          role: user.role,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    // Al crear / renovar el JWT
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    // Lo que verá la sesión en el cliente
    async session({ session, token }) {
      if (token.id)   session.user.id   = token.id as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",  // Ruta de tu formulario de login
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
