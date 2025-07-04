// File: src/app/api/raffles/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import type { OptionalUnlessRequiredId } from "mongodb";

interface RaffleDoc {
  _id: string;
  code: string;
  title: string;
  slogan: string;
  prize: string;
  price: number;
  date: Date;       // ← nueva fecha de sorteo
  createdAt: Date;
}

export async function GET(request: Request) {
  const db = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    const raffle = await col.findOne({ code: code.toUpperCase() });
    if (!raffle) {
      return NextResponse.json({ message: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json(raffle);
  }

  const all = await col.find().sort({ createdAt: -1 }).toArray();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const { title, slogan, prize, price, date } = await request.json();
  const db = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  const count = await col.countDocuments();
  const code = `R${count + 1}`;
  const id   = uuidv4();

  const doc: OptionalUnlessRequiredId<RaffleDoc> = {
    _id: id,
    code,
    title,
    slogan,
    prize,
    price,
    date: new Date(date),    // ← guardamos la fecha
    createdAt: new Date(),
  };

  await col.insertOne(doc);
  return NextResponse.json({ id, code }, { status: 201 });
}
