// File: src/app/api/raffles/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions }        from "../auth/[...nextauth]/route";
import { dbPromise }          from "@/lib/mongodb";
import { v4 as uuidv4 }       from "uuid";

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const db      = await dbPromise;
  const col     = db.collection<RaffleDoc>("raffles");

  const url   = new URL(request.url);
  const codeQ = url.searchParams.get("code");

  // 1) Si llega ?code=XXX, buscamos UNA SÓLA rifa
  if (codeQ) {
    const code = codeQ.toUpperCase();
    const raffle = await col.findOne({ code });
    if (!raffle) {
      return NextResponse.json(
        { message: `Rifa con código ${code} no encontrada` },
        { status: 404 }
      );
    }
    return NextResponse.json(raffle);
  }

  // 2) Si no hay código en la query, listamos todas (con filtro por rol)
  let filter: Partial<RaffleDoc> = {};
  if (session && session.user.role !== "admin") {
    filter = { createdBy: session.user.id };
  }

  const all = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { title, slogan, prize, price, date } = (await request.json()) as {
    title:  string;
    slogan: string;
    prize:  string;
    price:  number;
    date?:  string;
  };

  const db  = await dbPromise;
  const col = db.collection<RaffleDoc>("raffles");

  // Generar código secuencial R1, R2, …
  const count = await col.countDocuments();
  const code  = `R${count + 1}`;

  const newRaffle: RaffleDoc = {
    _id:        uuidv4(),
    code,
    title,
    slogan,
    prize,
    price,
    date,
    createdAt:  new Date(),
    createdBy:  session.user.id,
  };
  await col.insertOne(newRaffle);

  return NextResponse.json(
    { id: newRaffle._id, code: newRaffle.code },
    { status: 201 }
  );
}
