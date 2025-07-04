// File: src/components/RaffleGrid.tsx
"use client";

import { useEffect, useState } from "react";

interface Ticket {
  _id: string;
  raffleId: string;
  number: string;
  status: "disponible" | "ocupado";
  pago: boolean;
  buyer: string;
  paymentMethod: string;
  updatedAt: string;
}

interface Raffle {
  _id: string;
  code: string;
  title: string;
  slogan: string;
  prize: string;
  price: number;
  date?: string;
}

interface Props {
  raffleId: string;
}

export default function RaffleGrid({ raffleId }: Props) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const rRes = await fetch(`/api/raffles/${raffleId}`);
      if (!rRes.ok) return;
      setRaffle(await rRes.json());
      const tRes = await fetch(`/api/raffles/${raffleId}/tickets`);
      setTickets(await tRes.json());
      setLoading(false);
    }
    load();
  }, [raffleId]);

  if (loading) {
    return <p className="text-center mt-12 text-xl text-gray-600">Cargando…</p>;
  }
  if (!raffle) {
    return <p className="text-center mt-12 text-xl text-red-600">Rifa no encontrada</p>;
  }

  const cellClass = (t: Ticket) => {
    if (t.status === "disponible") return "bg-white hover:bg-gray-100";
    if (!t.pago)                     return "bg-yellow-300 hover:bg-yellow-400";
    return "bg-green-300 hover:bg-green-400";
  };

  const fechaSort = raffle.date
    ? new Date(raffle.date).toLocaleDateString()
    : "—";

  return (
    <div className="px-4 py-6">
      {/* Botón copiar enlace */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="text-lg px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Copiar enlace
        </button>
      </div>

      {/* Contenedor de la rifa */}
      <div className="mx-auto max-w-full bg-white rounded-3xl shadow-xl p-6">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            {raffle.title}
          </h1>
          <p className="text-lg sm:text-2xl italic text-gray-700 mt-1">
            {raffle.slogan}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-base sm:text-lg text-gray-800">
            <span>🎁 <strong>Premio:</strong> {raffle.prize}</span>
            <span>💵 <strong>Precio:</strong> ${raffle.price} / número</span>
            <span>🗓 <strong>Sorteo:</strong> {fechaSort}</span>
          </div>
        </header>

        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm sm:text-base text-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-500 bg-white" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-300" />
            <span>Ocupado (no pagado)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-300" />
            <span>Ocupado (pagado)</span>
          </div>
        </div>

        {/* Grilla responsive sin scroll */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => setSelected(t)}
              className={`border border-gray-300 py-3 text-center cursor-pointer ${cellClass(t)}`}
            >
              <span className="text-lg sm:text-xl font-medium text-gray-900">
                {t.number}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Número {selected.number}
            </h2>
            {selected.status === "disponible" ? (
              <p className="text-xl text-green-700 mb-4">Disponible</p>
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-800 mb-1">Ocupado</p>
                <p className={`text-lg mb-2 ${selected.pago ? "text-green-700" : "text-yellow-700"}`}>
                  {selected.pago ? "Pagado" : "No pagado"}
                </p>
                <p className="text-base text-gray-800 mb-1">
                  Comprador: {selected.buyer || "—"}
                </p>
                <p className="text-base text-gray-800 mb-1">
                  Método: {selected.paymentMethod || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  Actualizado: {new Date(selected.updatedAt).toLocaleString()}
                </p>
              </>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full text-base sm:text-lg font-medium bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
