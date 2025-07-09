// File: src/app/api/raffles/[id]/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";

type Context = { params: Promise<{ id: string }> };

interface RaffleRaw {
  _id: string | ObjectId;
  code: string;
  title: string;
  slogan: string;
  prize: string;
  price: number;
  date?: Date;
  status: "activa" | "inactiva";
  createdAt: Date;
}

// GET /api/raffles/[id]
export async function GET(
  _request: Request,
  context: Context
) {
  const { id: raw } = await context.params;
  const code = raw.toUpperCase();

  const db = await dbPromise;
  const col = db.collection<RaffleRaw>("raffles");

  const raffleRaw = await col.findOne({
    $or: [{ _id: raw }, { code }],
  });
  if (!raffleRaw) {
    return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    _id: typeof raffleRaw._id === "string"
      ? raffleRaw._id
      : raffleRaw._id.toHexString(),
    code: raffleRaw.code,
    title: raffleRaw.title,
    slogan: raffleRaw.slogan,
    prize: raffleRaw.prize,
    price: raffleRaw.price,
    date: raffleRaw.date?.toISOString(),
    status: raffleRaw.status,
  });
}

// DELETE /api/raffles/[id]
export async function DELETE(
  _request: Request,
  context: Context
) {
  const { id } = await context.params;
  const db = await dbPromise;

  // 1) Borrar la rifa
  await db.collection<RaffleRaw>("raffles").deleteOne({ _id: id });

  // 2) Borrar todos los tickets asociados
  await db.collection("tickets").deleteMany({ raffleId: id });

  // 3) Devolver éxito
  return NextResponse.json({ success: true });
}
