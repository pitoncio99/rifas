// File: src/app/raffles/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import RaffleGrid from "../../../components/RaffleGrid";

export default function RafflePage() {
  // useParams puede dar string | string[] | undefined
  const params = useParams();
  const rawId = params?.id;

  // Garantizamos que id sea un string
  const id =
    Array.isArray(rawId) 
      ? rawId[0]       // si viniera como array, coge el primero
      : rawId;         // si es string o undefined, lo usamos directo

  if (!id) {
    return (
      <p className="text-center mt-8 text-red-600">
        ID de rifa inválido
      </p>
    );
  }

  return <RaffleGrid raffleId={id} />;
}
