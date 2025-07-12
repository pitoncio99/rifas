// File: src/app/api/raffles/[id]/tickets/route.ts

import { NextResponse } from "next/server";
import { dbPromise }    from "@/lib/mongodb";
import crypto           from "crypto";

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

interface TicketDoc {
  _id:           string;
  raffleId:      string;
  number:        string;
  status:        "disponible" | "ocupado";
  pago:          boolean;
  buyer:         string;
  paymentMethod: string;
  updatedAt:     Date;   // <–– cambiado a Date
}

// Context.params es una promesa que hay que awaitear
type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/raffles/[id]/tickets
 */
export async function GET(_req: Request, context: Context) {
  const { id: raw } = await context.params;
  const code        = raw.toUpperCase();

  const db          = await dbPromise;
  const rafflesCol  = db.collection<RaffleDoc>("raffles");
  const raffle      = await rafflesCol.findOne({
    $or: [{ _id: raw }, { code }],
  });
  if (!raffle) {
    return NextResponse.json(
      { message: `Rifa “${raw}” no encontrada` },
      { status: 404 }
    );
  }

  const ticketsCol = db.collection<TicketDoc>("tickets");
  let tickets      = await ticketsCol
    .find({ raffleId: raffle._id })
    .sort({ number: 1 })
    .toArray();

  if (tickets.length === 0) {
    // Inicializamos tickets 00–99
    const inicial: TicketDoc[] = Array.from({ length: 100 }, (_, i) => ({
      _id:           crypto.randomUUID(),
      raffleId:      raffle._id,
      number:        String(i).padStart(2, "0"),
      status:        "disponible",
      pago:          false,
      buyer:         "",
      paymentMethod: "",
      updatedAt:     new Date(),  // ya es Date
    }));
    await ticketsCol.insertMany(inicial);
    tickets = inicial;
  }

  return NextResponse.json(tickets);
}

/**
 * PUT /api/raffles/[id]/tickets
 */
export async function PUT(req: Request, context: Context) {
  const { id: raw } = await context.params;
  const code        = raw.toUpperCase();

  const db         = await dbPromise;
  const rafflesCol = db.collection<RaffleDoc>("raffles");
  const raffle     = await rafflesCol.findOne({
    $or: [{ _id: raw }, { code }],
  });
  if (!raffle) {
    return NextResponse.json(
      { message: `Rifa “${raw}” no encontrada` },
      { status: 404 }
    );
  }

  const { _id, status, pago, buyer, paymentMethod } =
    (await req.json()) as {
      _id: string;
      status: "disponible" | "ocupado";
      pago: boolean;
      buyer: string;
      paymentMethod: string;
    };

  const ticketsCol = db.collection<TicketDoc>("tickets");
  const result = await ticketsCol.updateOne(
    { _id, raffleId: raffle._id },
    {
      $set: {
        status,
        pago,
        buyer,
        paymentMethod,
        updatedAt: new Date(),  // Date ok
      },
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { message: "Ticket no encontrado" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
