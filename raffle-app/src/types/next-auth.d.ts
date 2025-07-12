// File: src/types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * En session.user tendrás TODO lo que NextAuth define en DefaultSession["user"]
   * más nuestros campos personalizados: id y role.
   */
  interface Session {
    user: {
      id: string;
      role: "admin" | "user";
    } & DefaultSession["user"];
  }
  /** Si en algún momento usas `getUser` o `user` en callbacks, también puedes extenderlo: */
  interface User {
    id: string;
    role: "admin" | "user";
  }
}

declare module "next-auth/jwt" {
  /** Esto es para que el JWT lleve también id y role */
  interface JWT extends DefaultJWT {
    id: string;
    role: "admin" | "user";
  }
}
