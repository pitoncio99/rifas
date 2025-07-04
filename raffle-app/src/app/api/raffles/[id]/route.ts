import { NextResponse } from "next/server";
import { dbPromise } from "../../../../lib/mongodb";

interface RaffleDoc {
  _id: string;
  code: string;
  title: string;
  slogan: string;
  prize: string;
  price: number;
  createdAt: Date;
}

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Context) {
  const { id } = await context.params;
  const db = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  // Detecta si es código R123 o UUID
  const filter = /^R\d+$/i.test(id)
    ? { code: id.toUpperCase() }
    : { _id: id };

  const raffle = await col.findOne(filter);
  if (!raffle) {
    return NextResponse.json({ message: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json(raffle);
}
