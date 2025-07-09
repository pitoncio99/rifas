// File: src/app/api/raffles/[id]/route.ts

import { NextResponse } from "next/server";
import { dbPromise }    from "@/lib/mongodb";

interface RaffleDoc {
  _id:       string;
  code:      string;
  title:     string;
  slogan:    string;
  prize:     string;
  price:     number;
  date?:     string;
  createdAt: Date;
  createdBy: string;
}

// Context.params es una promesa que hay que awaitear
type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/raffles/[id]
 * Busca una rifa por _id o por code (R1, R2, ...)
 */
export async function GET(_req: Request, context: Context) {
  const { id: raw } = await context.params;
  const code = raw.toUpperCase();

  const db  = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  const raffle = await col.findOne({
    $or: [{ _id: raw }, { code }],
  });

  if (!raffle) {
    return NextResponse.json(
      { message: `Rifa “${raw}” no encontrada` },
      { status: 404 }
    );
  }

  return NextResponse.json(raffle);
}

/**
 * DELETE /api/raffles/[id]
 * Elimina la rifa Y TODOS sus tickets
 */
export async function DELETE(_req: Request, context: Context) {
  const { id } = await context.params;

  const db = await dbPromise;
  // 1) Borra la rifa
  await db.collection("raffles").deleteOne({ _id: id });
  // 2) Borra todos los tickets relacionados
  await db.collection("tickets").deleteMany({ raffleId: id });

  // 3) 204 No Content
  return new NextResponse(null, { status: 204 });
}
