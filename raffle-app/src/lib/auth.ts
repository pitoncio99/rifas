// File: src/lib/auth.ts
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcrypt";
import { dbPromise } from "./mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        // 🔑 aquí lo llamamos 'identifier'
        identifier: { label: "Email", type: "text", placeholder: "tu@correo.com" },
        password:   { label: "Contraseña", type: "password" },
      },
      // Firma correcta: (credentials, req)
      async authorize(credentials, req) {
        console.log("→ authorize credentials:", credentials);
        if (!credentials) return null;
        // cogemos el email de 'identifier'
        const email = credentials.identifier;
        const db    = await dbPromise;
        const user  = await db.collection("users").findOne({ email });
        console.log("→ usuario encontrado:", user);
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        console.log("→ contraseña válida:", valid);
        if (!valid) return null;

        // NextAuth exige que id sea string
        return {
          id:           String(user._id),
          name:         user.name,
          email:        user.email,
          role:         user.role,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages:   { signIn: "/auth/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user!,
        id:   token.id   as string,
        role: token.role as "admin" | "user",
      };
      return session;
    },
  },

  // asegúrate de tener esto en tu env:
  secret: process.env.NEXTAUTH_SECRET,
};
