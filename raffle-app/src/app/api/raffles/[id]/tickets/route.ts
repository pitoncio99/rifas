// File: src/app/api/raffles/[id]/tickets/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "../../../../../lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import type { OptionalUnlessRequiredId, WithId } from "mongodb";

type Context = { params: Promise<{ id: string }> };

interface RaffleDoc {
  _id: string;
  code: string;
}

interface TicketDoc {
  _id: string;
  raffleId: string;
  number: string;
  status: "disponible" | "ocupado";
  pago: boolean;
  buyer: string;
  paymentMethod: string;  // ← nuevo medio de pago
  updatedAt: Date;
}

export async function GET(_req: Request, context: Context) {
  const { id: rawId } = await context.params;
  const db = await dbPromise;

  // 1) resolvemos UUID de la rifa
  const rafflesCol = db.collection<RaffleDoc>("raffles");
  const raffle = /^R\d+$/i.test(rawId)
    ? await rafflesCol.findOne({ code: rawId.toUpperCase() })
    : await rafflesCol.findOne({ _id: rawId });
  if (!raffle) {
    return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
  }
  const raffleId = raffle._id;

  // 2) traemos y ordenamos
  const ticketsCol = db.collection<TicketDoc>("tickets");
  let tickets = await ticketsCol
    .find({ raffleId })
    .sort({ number: 1 })
    .toArray();

  // 3) si no existen, sembramos
  if (tickets.length === 0) {
    const inicial: Omit<TicketDoc, "_id">[] = Array.from({ length: 100 }, (_, i) => ({
      raffleId,
      number: String(i).padStart(2, "0"),
      status: "disponible",
      pago: false,
      buyer: "",
      paymentMethod: "",
      updatedAt: new Date(),
    }));
    const docs: OptionalUnlessRequiredId<TicketDoc>[] = inicial.map(t => ({
      _id: uuidv4(),
      ...t,
    }));
    await ticketsCol.insertMany(docs);
    tickets = await ticketsCol.find({ raffleId }).sort({ number: 1 }).toArray();
  }

  return NextResponse.json(tickets as WithId<TicketDoc>[]);
}

export async function PUT(request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const { number, status, pago, buyer, paymentMethod } = await request.json();

  const db = await dbPromise;
  const rafflesCol = db.collection<RaffleDoc>("raffles");
  const raffle = /^R\d+$/i.test(rawId)
    ? await rafflesCol.findOne({ code: rawId.toUpperCase() })
    : await rafflesCol.findOne({ _id: rawId });
  if (!raffle) {
    return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
  }
  const raffleId = raffle._id;

  const ticketsCol = db.collection<TicketDoc>("tickets");
  await ticketsCol.updateOne(
    { raffleId, number },
    {
      $set: {
        status,
        pago,
        buyer: buyer ?? "",
        paymentMethod: paymentMethod ?? "",
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return new NextResponse(null, { status: 204 });
}
