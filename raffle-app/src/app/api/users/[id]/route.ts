// File: src/app/api/users/[id]/route.ts

import { NextResponse } from "next/server";
import { dbPromise }   from "@/lib/mongodb";

interface UserDoc {
  _id:       string;   // ahora esperamos UUID/string
  name:      string;
  email:     string;
  role:      "admin" | "user";
  password:  string;
  createdAt: Date;
}

// Context.params es una promesa que hay que awaitear
type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  context: Context
) {
  // 1) Espera la promesa de params
  const { id } = await context.params;
  const db     = await dbPromise;

  // 2) Especifica el genérico <UserDoc> para que _id sea string
  const col = db.collection<UserDoc>("users");

  // 3) Borra el usuario por _id:string
  const result = await col.deleteOne({ _id: id });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { message: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  // 4) 204 No Content
  return new NextResponse(null, { status: 204 });
}
