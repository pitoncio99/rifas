// File: src/app/api/users/[id]/route.ts

import { NextResponse } from "next/server";
import { dbPromise } from "../../../../lib/mongodb";

type Context = {
  // Next.js pasa `params` como una promesa en rutas dinámicas
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  context: Context
) {
  // 1) awaitea params antes de desestructurar
  const { id } = await context.params;
  const db = await dbPromise;

  // 2) borra el usuario por _id (que aquí es un string, idealmente UUID)
  const result = await db
    .collection("users")
    .deleteOne({ _id: id });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { message: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  // 3) HTTP 204 No Content sin body
  return new NextResponse(null, { status: 204 });
}
