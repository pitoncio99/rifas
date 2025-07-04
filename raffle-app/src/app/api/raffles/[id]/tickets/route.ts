// src/app/api/raffles/[id]/tickets/route.ts

import { NextResponse } from "next/server";
import { dbPromise } from "../../../../../lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import type { OptionalUnlessRequiredId, WithId } from "mongodb";

type Context = { params: Promise<{ id: string }> };

interface RaffleDoc {
  _id: string;
  code: string;
  // ...otros campos
}

interface TicketDoc {
  _id: string;
  raffleId: string;       // siempre UUID
  number: string;
  status: "disponible" | "ocupado";
  pago: boolean;
  buyer: string;
  updatedAt: Date;
}

export async function GET(_req: Request, context: Context) {
  // 1) Resuelve el param
  const { id: rawId } = await context.params;

  const db = await dbPromise;

  // 2) Descubre el UUID real de la rifa
  const rafflesCol = db.collection<RaffleDoc>("raffles");
  let raffleDoc: RaffleDoc | null = null;

  if (/^R\d+$/i.test(rawId)) {
    // Si es código R123, búscalo por code
    raffleDoc = await rafflesCol.findOne({ code: rawId.toUpperCase() });
    if (!raffleDoc) {
      return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
    }
  } else {
    // Si no, asumimos que rawId ya es el _id
    raffleDoc = await rafflesCol.findOne({ _id: rawId });
    if (!raffleDoc) {
      return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
    }
  }

  const raffleId = raffleDoc._id;

  // 3) Trabaja con tickets bajo raffleId (UUID)
  const ticketsCol = db.collection<TicketDoc>("tickets");
  let tickets = await ticketsCol.find({ raffleId }).toArray();

  if (tickets.length === 0) {
    // Sembramos los 100 tickets iniciales
    const inicial: Omit<TicketDoc, "_id">[] = Array.from({ length: 100 }, (_, i) => ({
      raffleId,
      number: String(i).padStart(2, "0"),
      status: "disponible",
      pago: false,
      buyer: "",
      updatedAt: new Date(),
    }));

    const docs: OptionalUnlessRequiredId<TicketDoc>[] = inicial.map((t) => ({
      _id: uuidv4(),
      ...t,
    }));

    await ticketsCol.insertMany(docs);
    tickets = await ticketsCol.find({ raffleId }).toArray();
  }

  return NextResponse.json(tickets as WithId<TicketDoc>[]);
}

export async function PUT(request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const { number, status, pago, buyer } = await request.json();

  const db = await dbPromise;

  // Igual que en GET, resolvemos primero el UUID de la rifa
  const rafflesCol = db.collection<RaffleDoc>("raffles");
  let raffleDoc: RaffleDoc | null = null;

  if (/^R\d+$/i.test(rawId)) {
    raffleDoc = await rafflesCol.findOne({ code: rawId.toUpperCase() });
  } else {
    raffleDoc = await rafflesCol.findOne({ _id: rawId });
  }
  if (!raffleDoc) {
    return NextResponse.json({ message: "Rifa no encontrada" }, { status: 404 });
  }
  const raffleId = raffleDoc._id;

  // Ahora actualizamos el ticket correcto
  const ticketsCol = db.collection<TicketDoc>("tickets");
  await ticketsCol.updateOne(
    { raffleId, number },
    {
      $set: {
        status,
        pago,
        buyer: buyer ?? "",
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // 204 No Content sin body
  return new NextResponse(null, { status: 204 });
}
