"use client";

import { useEffect, useState } from "react";

interface Ticket {
  _id: string;
  raffleId: string;
  number: string;
  status: "disponible" | "ocupado";
  pago: boolean;
  buyer: string;
  updatedAt: string;
}

interface Raffle {
  _id: string;
  code: string;
  title: string;
  slogan: string;
  prize: string;
  price: number;
}

interface Props {
  raffleId: string;  // "R1" o UUID
}

export default function RaffleGrid({ raffleId }: Props) {
  const [raffle, setRaffle]   = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // 1) Carga la rifa (el endpoint detecta code vs _id)
      const rRes = await fetch(`/api/raffles/${raffleId}`);
      if (!rRes.ok) {
        setRaffle(null);
        setTickets([]);
        setLoading(false);
        return;
      }
      const dataR: Raffle = await rRes.json();
      setRaffle(dataR);

      // 2) Carga los tickets
      const tRes = await fetch(`/api/raffles/${raffleId}/tickets`);
      const dataT: Ticket[] = await tRes.json();
      setTickets(dataT);

      setLoading(false);
    }
    load();
  }, [raffleId]);

  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <p className="text-center mt-8 text-gray-600">Cargando…</p>;
  }
  if (!raffle) {
    return <p className="text-center mt-8 text-red-600">Rifa no encontrada</p>;
  }

  // Determina la clase CSS de cada celda
  const cellClass = (t: Ticket) => {
    if (t.status === "disponible") return "bg-white hover:bg-gray-50";
    if (!t.pago)                   return "bg-yellow-200 hover:bg-yellow-300";
    return "bg-green-200 hover:bg-green-300";
  };

  return (
    <>
      {/* Botón para copiar enlace */}
      <div className="max-w-5xl mx-auto p-4 flex justify-end">
        <button
          onClick={copyLink}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>

      {/* Tarjeta principal */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">{raffle.title}</h1>
          <p className="italic text-gray-700">{raffle.slogan}</p>
          <p className="mt-2 text-gray-700">
            🎁 Premio: <strong>{raffle.prize}</strong>
          </p>
          <p className="text-gray-700">
            💵 Precio: <strong>${raffle.price}</strong> por número
          </p>
        </header>

        <div className="grid grid-cols-10 gap-1">
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => setSelected(t)}
              className={`border border-gray-300 p-2 text-center select-none cursor-pointer ${cellClass(t)}`}
            >
              <span className="text-gray-800">{t.number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de información */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Número {selected.number}
            </h2>

            {selected.status === "disponible" ? (
              <p className="text-green-700 text-lg mb-4">Disponible</p>
            ) : (
              <>
                <p className="text-gray-800 text-lg font-semibold mb-1">Ocupado</p>
                <p className={`mb-2 ${selected.pago ? "text-green-700" : "text-yellow-700"}`}>
                  {selected.pago ? "Pagado" : "No pagado"}
                </p>
                <p className="text-gray-800 mb-1">
                  Comprador: {selected.buyer || "—"}
                </p>
                <p className="text-gray-600 text-sm">
                  Actualizado: {new Date(selected.updatedAt).toLocaleString()}
                </p>
              </>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full border border-gray-300 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
