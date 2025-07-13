// File: src/app/api/raffles/bulk-update/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { raffleId, numbers, data } = await req.json();
    const db = await dbPromise;

    const result = await db.collection("tickets").updateMany(
      { raffleId, number: { $in: numbers } },
      { $set: data }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}
