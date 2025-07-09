// File: src/app/api/raffles/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "@/lib/mongodb";

interface RaffleDoc {
  _id: string;
  code: string;
  title: string;
  slogan: string;
  prize: string;
  price: number;
  date?: Date;
  status: "activa" | "inactiva";
  createdAt: Date;
}

export async function GET(request: Request) {
  const db = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  const url = new URL(request.url);
  // Normaliza a mayúsculas si viene ?code=
  const rawCode = url.searchParams.get("code");
  if (rawCode) {
    const code = rawCode.toUpperCase();
    const raffle = await col.findOne({ code });
    if (!raffle) {
      return NextResponse.json({ message: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json(raffle);
  }

  // Si no hay código en query, devolvemos todas
  const all = await col.find().sort({ createdAt: -1 }).toArray();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const { title, slogan, prize, price, date } = await request.json();
  const db = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  const count = await col.countDocuments();
  const code = `R${count + 1}`;

  const newRaffle: RaffleDoc = {
    _id: crypto.randomUUID(),
    code,
    title,
    slogan,
    prize,
    price,
    date: date ? new Date(date) : undefined,
    status: "activa",
    createdAt: new Date(),
  };

  await col.insertOne(newRaffle);
  return NextResponse.json({ id: newRaffle._id, code }, { status: 201 });
}
