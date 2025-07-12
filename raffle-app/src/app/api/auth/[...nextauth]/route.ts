// File: src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth genera un handler capaz de servir GET y POST
const handler = NextAuth(authOptions);

// ¡Sólo exportamos esos handlers!
export { handler as GET, handler as POST };
