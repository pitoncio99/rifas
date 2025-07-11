// File: src/app/api/raffles/[id]/route.ts

import { NextResponse } from "next/server";
import { dbPromise }    from "@/lib/mongodb";

interface RaffleDoc {
  _id:       string;    // UUID como string
  code:      string;
  title:     string;
  slogan:    string;
  prize:     string;
  price:     number;
  date?:     string;
  createdAt: Date;
  createdBy: string;
}

type Context = { params: Promise<{ id: string }> };

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

export async function DELETE(_req: Request, context: Context) {
  const { id } = await context.params;

  const db  = await dbPromise;
  // 🔑 aquí indicamos el genérico para que _id sea string
  const col = db.collection<RaffleDoc>("raffles");

  await col.deleteOne({ _id: id });
  await db.collection("tickets").deleteMany({ raffleId: id });

  return new NextResponse(null, { status: 204 });
}
