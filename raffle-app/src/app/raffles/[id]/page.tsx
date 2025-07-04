"use client";

import RaffleGrid from "../../../components/RaffleGrid";

interface Props {
  params: { id: string };
}

export default function RafflePage({ params }: Props) {
  // params.id puede ser "R1" o un UUID
  return <RaffleGrid raffleId={params.id} />;
}
