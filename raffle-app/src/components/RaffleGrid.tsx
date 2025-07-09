// File: src/components/RaffleGrid.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RaffleGrid({ raffleId }: { raffleId: string }) {
  const [selected, setSelected] = useState<Ticket | null>(null);

  const { data: raffle, error: raffleErr } = useSWR<Raffle>(
    `/api/raffles/${raffleId}`,
    fetcher,
    { refreshInterval: 30_000 }
  );
  const { data: tickets, error: ticketsErr } = useSWR<Ticket[]>(
    `/api/raffles/${raffleId}/tickets`,
    fetcher,
    { refreshInterval: 10_000 }
  );

  if (raffleErr || ticketsErr) {
    return <p className="text-center mt-6 text-red-600">Error al cargar datos.</p>;
  }
  if (!raffle || !tickets) {
    return <p className="text-center mt-6 text-gray-600">Cargando…</p>;
  }

  // Estilos según estado
  const cellClass = (t: Ticket) => {
    if (t.status === "disponible") return "bg-white hover:bg-gray-100";
    if (!t.pago)                     return "bg-yellow-300 hover:bg-yellow-400";
    return "bg-green-300 hover:bg-green-400";
  };
  const fechaText = raffle.date
    ? new Date(raffle.date).toLocaleDateString()
    : "—";

  return (
    <div className="px-4 py-6">
      {/* Copiar enlace */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="text-lg px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Copiar enlace
        </button>
      </div>

      {/* Contenedor principal */}
      <div className="mx-auto max-w-4xl bg-white rounded-3xl shadow-xl p-8">
        {/* Encabezado */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-gray-900">
            {raffle.title}
          </h1>
          <p className="text-2xl italic text-gray-700 mt-2">
            {raffle.slogan}
          </p>

          {/* Nuevo: Código de la rifa */}
          <p className="text-lg font-medium text-gray-800 mt-1">
            <span className="opacity-70">Código:</span> {raffle.code}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-lg text-gray-800">
            <p>
              🎁 <strong>Premio:</strong> {raffle.prize}
            </p>
            <p>
              💵 <strong>Precio:</strong> ${raffle.price} / número
            </p>
            <p>
              🗓 <strong>Sorteo:</strong> {fechaText}
            </p>
          </div>
        </header>

        {/* Leyenda */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Leyenda:</h2>
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 text-gray-800 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-gray-500 bg-white mr-2" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-300 mr-2" />
              <span>Reservado (no pagado)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-300 mr-2" />
              <span>Ocupado (pagado)</span>
            </div>
          </div>
        </div>

        {/* Grilla de números */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => setSelected(t)}
              className={`border border-gray-300 p-4 text-center cursor-pointer ${cellClass(
                t
              )}`}
            >
              <span className="text-xl font-medium text-gray-900">
                {t.number}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Número {selected.number}
            </h2>

            {selected.status === "disponible" ? (
              <p className="text-2xl text-green-700 mb-4">
                Disponible
              </p>
            ) : (
              <>
                <p className="text-2xl font-semibold text-gray-800 mb-2">
                  Ocupado
                </p>
                <p
                  className={`text-xl mb-2 ${
                    selected.pago ? "text-green-700" : "text-yellow-700"
                  }`}
                >
                  {selected.pago ? "Pagado" : "No pagado"}
                </p>
                <p className="text-lg text-gray-800 mb-1">
                  Comprador: {selected.buyer || "—"}
                </p>
                <p className="text-lg text-gray-800 mb-1">
                  Método: {selected.paymentMethod || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  Actualizado: {new Date(selected.updatedAt).toLocaleString()}
                </p>
              </>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full text-lg font-medium bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
