// File: src/app/api/raffles/[id]/tickets/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";

interface RaffleRaw {
  _id: string | ObjectId;
  code: string;
}

interface TicketDoc {
  _id: string;
  raffleId: string;
  number: string;
  status: "disponible" | "ocupado";
  pago: boolean;
  buyer: string;
  paymentMethod: string;
  updatedAt: Date;
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: Context
) {
  // ¡Await aquí!
  const { id: raw } = await context.params;
  const code = raw.toUpperCase();

  const db = await dbPromise;

  // 1) Cargamos la rifa por UUID o por código
  const raffleCol = db.collection<RaffleRaw>("raffles");
  const raffleRaw = await raffleCol.findOne({
    $or: [{ _id: raw }, { code }],
  });
  if (!raffleRaw) {
    return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
  }

  // 2) Convertimos a string el _id si es ObjectId
  const raffleId =
    typeof raffleRaw._id === "string"
      ? raffleRaw._id
      : raffleRaw._id.toHexString();

  // 3) Obtenemos los tickets, ordenados
  const col = db.collection<TicketDoc>("tickets");
  let tickets = await col
    .find({ raffleId })
    .sort({ number: 1 })
    .toArray();

  // 4) Si no existían, los inicializamos
  if (tickets.length === 0) {
    const inicial: TicketDoc[] = Array.from({ length: 100 }, (_, i) => ({
      _id: crypto.randomUUID(),
      raffleId,
      number: String(i).padStart(2, "0"),
      status: "disponible",
      pago: false,
      buyer: "",
      paymentMethod: "",
      updatedAt: new Date(),
    }));
    await col.insertMany(inicial);
    tickets = inicial;
  }

  return NextResponse.json(tickets);
}

export async function PUT(
  request: Request,
  context: Context
) {
  // Y aquí también
  const { id } = await context.params;
  const data = (await request.json()) as TicketDoc;

  const db = await dbPromise;
  const col = db.collection<TicketDoc>("tickets");

  await col.updateOne(
    { _id: data._id },
    {
      $set: {
        status: data.status,
        pago: data.pago,
        buyer: data.buyer,
        paymentMethod: data.paymentMethod,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ success: true }, { status: 200 });
}
