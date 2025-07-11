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
        username: { label: "Email", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      // 👇 Firma correcta: recibe credentials y req (aunque no uses req, debe estar)
      async authorize(credentials, req) {
        if (!credentials) return null;
        const db = await dbPromise;
        const user = await db
          .collection("users")
          .findOne({ email: credentials.username });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!valid) return null;

        // 👇 Convierte ObjectId a string
        return {
          id:   user._id.toString(),
          name: user.name,
          email:user.email,
          role: user.role,
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
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id:    token.id as string,
          name:  session.user?.name!,
          email: session.user?.email!,
          role:  token.role as "admin" | "user",
        };
      }
      return session;
    },
  },
};
