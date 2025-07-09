// File: src/components/TicketManager.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Ticket {
  _id: string;
  number: string;
  status: "disponible" | "ocupado";
  pago: boolean;
  buyer: string;
  paymentMethod: string;
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

export default function TicketManager() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [edited, setEdited] = useState<Record<string, Partial<Ticket>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadAll() {
      setLoading(true);
      // 1) Rifa
      const rRes = await fetch(`/api/raffles/${id}`);
      if (rRes.ok) {
        const dataR: Raffle = await rRes.json();
        setRaffle({
          ...dataR,
          date: dataR.date
            ? new Date(dataR.date).toLocaleDateString()
            : undefined,
        });
      }
      // 2) Tickets
      const tRes = await fetch(`/api/raffles/${id}/tickets`);
      if (tRes.ok) {
        const dataT: Ticket[] = await tRes.json();
        setTickets(dataT);
      }
      setLoading(false);
    }

    loadAll();
  }, [id]);

  const onFieldChange = (
    ticketId: string,
    field: keyof Omit<Ticket, "_id" | "number">,
    value: Ticket[typeof field]
  ) => {
    setEdited((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (ticketId: string) => {
    const original = tickets.find((t) => t._id === ticketId);
    const changes = edited[ticketId];
    if (!original || !changes) return;

    const updated = { ...original, ...changes };
    await fetch(`/api/raffles/${id}/tickets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? updated : t))
    );
    setEdited((prev) => {
      const copy = { ...prev };
      delete copy[ticketId];
      return copy;
    });
  };

  if (!id) {
    return <p className="p-4 text-red-600">ID inválido</p>;
  }
  if (loading) {
    return <p className="p-4 text-gray-800">Cargando datos…</p>;
  }
  if (!raffle) {
    return <p className="p-4 text-red-600">No se encontró la rifa.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Datos Rifa */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          {raffle.title}
        </h1>
        <p className="text-lg italic text-gray-700 mb-4">{raffle.slogan}</p>
        <div className="flex flex-wrap gap-6 text-gray-800 text-base">
          <span>🆔 <strong>Código:</strong> {raffle.code}</span>
          <span>🎁 <strong>Premio:</strong> {raffle.prize}</span>
          <span>💵 <strong>Precio:</strong> ${raffle.price}</span>
          <span>🗓 <strong>Sorteo:</strong> {raffle.date ?? "—"}</span>
        </div>
      </div>

      {/* Cabecera Tabla */}
      <h2 className="text-2xl font-semibold text-gray-900">Gestión de Números</h2>

      {/* Tabla de tickets */}
      <div className="overflow-x-auto bg-gray-100 p-4 rounded-lg">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left text-gray-700">Número</th>
              <th className="p-3 text-left text-gray-700">Status</th>
              <th className="p-3 text-center text-gray-700">Pagado</th>
              <th className="p-3 text-left text-gray-700">Comprador</th>
              <th className="p-3 text-left text-gray-700">Medio pago</th>
              <th className="p-3 text-center text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((t) => {
              const pending = edited[t._id] !== undefined;
              const current = { ...t, ...edited[t._id] };
              const isAvailable = current.status === "disponible";

              return (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{t.number}</td>
                  <td className="p-3">
                    <select
                      value={current.status}
                      onChange={(e) =>
                        onFieldChange(
                          t._id,
                          "status",
                          e.target.value as Ticket["status"]
                        )
                      }
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded"
                    >
                      <option value="disponible">disponible</option>
                      <option value="ocupado">ocupado</option>
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={current.pago}
                      disabled={isAvailable}
                      onChange={(e) =>
                        onFieldChange(t._id, "pago", e.target.checked)
                      }
                      className="accent-blue-600 disabled:opacity-50"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={current.buyer}
                      disabled={isAvailable}
                      onChange={(e) =>
                        onFieldChange(t._id, "buyer", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={current.paymentMethod}
                      disabled={isAvailable}
                      onChange={(e) =>
                        onFieldChange(
                          t._id,
                          "paymentMethod",
                          e.target.value
                        )
                      }
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded disabled:opacity-50"
                    >
                      <option value="">— selecciona —</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleSave(t._id)}
                      disabled={!pending}
                      className={`px-3 py-1 rounded text-sm ${
                        pending
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
