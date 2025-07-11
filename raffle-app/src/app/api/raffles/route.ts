// File: src/app/api/raffles/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbPromise }  from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";

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

// GET /api/raffles?code=...
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const db      = await dbPromise;
  const col     = db.collection<RaffleDoc>("raffles");

  const url   = new URL(request.url);
  const codeQ = url.searchParams.get("code");

  // Si viene ?code=XXX, devolvemos solo esa rifa
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

  // Si no hay código, listamos todas, pero
  // si el usuario logueado NO es admin, filtramos por createdBy
  let filter: Partial<RaffleDoc> = {};
  const role   = session?.user?.role;
  const userId = session?.user?.id;
  if (role !== "admin" && typeof userId === "string") {
    filter = { createdBy: userId };
  }

  const all = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(all);
}

// POST /api/raffles
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId  = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
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

  // Creamos un código R1, R2… incrementando según el count
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
    createdBy:  userId,
  };

  await col.insertOne(newRaffle);

  return NextResponse.json(
    { id: newRaffle._id, code: newRaffle.code },
    { status: 201 }
  );
}
