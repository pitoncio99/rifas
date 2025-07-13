// src/components/TicketManager.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

// Colores para Efectivo, Transferencia y No pagados
const COLORS = ["#34d399", "#60a5fa", "#facc15"];

export default function TicketManager() {
  const { id } = useParams() as { id: string };

  // Estados principales
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [edited, setEdited] = useState<Record<string, Partial<Ticket>>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Edición masiva
  const [bulkBuyer, setBulkBuyer] = useState("");
  const [bulkStatus, setBulkStatus] = useState<"ocupado" | "disponible">("ocupado");
  const [bulkPago, setBulkPago] = useState(true);
  const [bulkMetodo, setBulkMetodo] = useState<"Transferencia" | "Efectivo">("Transferencia");

  // Asignación aleatoria
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomStep, setRandomStep] = useState<"cantidad" | "form">("cantidad");
  const [randomAmount, setRandomAmount] = useState(1);
  const [randomSelection, setRandomSelection] = useState<string[]>([]);
  const [randomBuyer, setRandomBuyer] = useState("");
  const [randomPago, setRandomPago] = useState(true);
  const [randomMetodo, setRandomMetodo] = useState<"Transferencia" | "Efectivo">("Transferencia");

  // Pago inline en "no pagados"
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payMethodLocal, setPayMethodLocal] = useState<"Transferencia" | "Efectivo">("Transferencia");

  // Carga inicial de rifa y tickets
  useEffect(() => {
    if (!id) return;
    async function loadAll() {
      setLoading(true);
      const rRes = await fetch(`/api/raffles/${id}`);
      if (rRes.ok) setRaffle(await rRes.json());
      const tRes = await fetch(`/api/raffles/${id}/tickets`);
      if (tRes.ok) setTickets(await tRes.json());
      setLoading(false);
    }
    loadAll();
  }, [id]);

  // Datos para el gráfico (Efectivo, Transferencia, No pagados)
  const chartData = (() => {
    const price = raffle?.price || 0;
    const efectivoCount = tickets.filter(
      (t) => t.status === "ocupado" && t.pago && t.paymentMethod === "Efectivo"
    ).length;
    const transferCount = tickets.filter(
      (t) => t.status === "ocupado" && t.pago && t.paymentMethod === "Transferencia"
    ).length;
    const unpaidCount = tickets.filter(
      (t) => t.status === "ocupado" && !t.pago
    ).length;
    return [
      { name: "Efectivo", value: efectivoCount * price, cantidad: efectivoCount },
      { name: "Transferencia", value: transferCount * price, cantidad: transferCount },
      { name: "No pagados", value: unpaidCount * price, cantidad: unpaidCount },
    ];
  })();

  // Formateo de fecha para evitar mismatch SSR/cliente
  const formattedDate = raffle?.date
    ? new Date(`${raffle.date}T12:00:00Z`).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  // Edición individual
  const onFieldChange = (
    ticketId: string,
    field: keyof Omit<Ticket, "_id" | "number">,
    value: Ticket[typeof field]
  ) => {
    setEdited((prev) => {
      const prevEdits = prev[ticketId] || {};
      let newEdits: Partial<Ticket> = { ...prevEdits, [field]: value };
      if (field === "status" && value === "disponible") {
        newEdits = { status: "disponible", pago: false, buyer: "", paymentMethod: "" };
      }
      if (field === "pago" && value === false) {
        newEdits.paymentMethod = "";
      }
      return { ...prev, [ticketId]: newEdits };
    });
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
    setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));
    setEdited((prev) => {
      const c = { ...prev }; delete c[ticketId]; return c;
    });
  };

  // Edición masiva
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/raffles/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raffleId: id,
        numbers: selected,
        data: {
          status: bulkStatus,
          buyer: bulkBuyer,
          pago: bulkPago,
          paymentMethod: bulkMetodo,
        },
      }),
    });

    // Actualizo localmente la tabla
    setTickets((prev) =>
      prev.map((t) =>
        selected.includes(t.number)
          ? {
              ...t,
              status: bulkStatus,
              buyer: bulkBuyer,
              pago: bulkPago,
              paymentMethod: bulkMetodo,
            }
          : t
      )
    );

    setSuccessMsg(`✅ ${selected.length} números asignados.`);
    setTimeout(() => setSuccessMsg(""), 4000);
    setSelected([]);
    setBulkBuyer("");
  };

  // Asignación aleatoria
  const handleRandomStart = () => {
    setRandomStep("cantidad");
    setRandomAmount(1);
    setRandomSelection([]);
    setShowRandomModal(true);
  };
  const handleRandomGenerate = () => {
    const disponibles = tickets.filter((t) => t.status === "disponible").map((t) => t.number);
    if (randomAmount > disponibles.length) {
      alert("No hay suficientes números disponibles.");
      return;
    }
    const seleccion: string[] = [];
    while (seleccion.length < randomAmount) {
      const n = disponibles[Math.floor(Math.random() * disponibles.length)];
      if (!seleccion.includes(n)) seleccion.push(n);
    }
    setRandomSelection(seleccion);
    setRandomBuyer("");
    setRandomPago(true);
    setRandomMetodo("Transferencia");
    setRandomStep("form");
  };
  const handleRandomConfirm = async () => {
    if (!randomBuyer.trim()) {
      alert("Comprador es obligatorio.");
      return;
    }
    await fetch("/api/raffles/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raffleId: id,
        numbers: randomSelection,
        data: {
          status: "ocupado",
          buyer: randomBuyer,
          pago: randomPago,
          paymentMethod: randomMetodo,
        },
      }),
    });
    setTickets((prev) =>
      prev.map((t) =>
        randomSelection.includes(t.number)
          ? { ...t, status: "ocupado", buyer: randomBuyer, pago: randomPago, paymentMethod: randomMetodo }
          : t
      )
    );
    setShowRandomModal(false);
    setSuccessMsg(`✅ ${randomSelection.length} números asignados.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };
  useEffect(() => {
    if (!randomPago) setRandomMetodo("Transferencia");
  }, [randomPago]);

  // Confirmar pago individual desde "no pagados"
  const handleConfirmPay = async (ticketId: string) => {
    const tkt = tickets.find((t) => t._id === ticketId);
    if (!tkt) return;
    await fetch(`/api/raffles/${id}/tickets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...tkt,
        pago: true,
        paymentMethod: payMethodLocal,
      }),
    });
    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId
          ? { ...t, pago: true, paymentMethod: payMethodLocal }
          : t
      )
    );
    setPayingId(null);
    setSuccessMsg(`✅ Número ${tkt.number} marcado como pagado.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  if (!id) return <p className="p-4 text-red-600">ID inválido</p>;
  if (loading) return <p className="p-4 text-gray-800">Cargando datos…</p>;
  if (!raffle) return <p className="p-4 text-red-600">Rifa no encontrada</p>;

  return (
    <div className="space-y-6">

      {/* Detalles de la rifa */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{raffle.title}</h1>
        <p className="text-lg italic text-gray-700 mb-4">{raffle.slogan}</p>
        <div className="flex flex-wrap gap-6 text-gray-800 text-base">
          <span>🆔 <strong>Código:</strong> {raffle.code}</span>
          <span>🎁 <strong>Premio:</strong> {raffle.prize}</span>
          <span>💵 <strong>Precio:</strong> ${raffle.price}</span>
          <span>🗓 <strong>Sorteo:</strong> {formattedDate}</span>
        </div>
      </div>

      {/* Gráfico de pagos */}
      <div className="bg-blue-50 border border-blue-300 p-4 rounded shadow">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Resumen de pagos</h3>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                dataKey="value"
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) =>
                  value !== undefined ? `${name}: $${value.toLocaleString()}` : ""
                }
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => `$${val.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm text-gray-800">
          {chartData.map((item) => (
            <div key={item.name}>
              <strong>{item.name}:</strong> {item.cantidad} tickets (${item.value.toLocaleString()})
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded border border-green-300">
          {successMsg}
        </div>
      )}

      {/* Botón de asignación aleatoria */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Gestión de Números</h2>
        <button
          onClick={handleRandomStart}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Asignar números al azar
        </button>
      </div>

      {/* Modal de asignación aleatoria */}
      {showRandomModal && (
        <div className="bg-white border border-gray-300 p-4 rounded shadow">
          {randomStep === "cantidad" ? (
            <div className="space-y-3">
              <p className="text-gray-700 font-medium">¿Cuántos números deseas?</p>
              <input
                type="number"
                min={1}
                max={tickets.filter((t) => t.status === "disponible").length}
                value={randomAmount}
                onChange={(e) => setRandomAmount(+e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRandomModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-1 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRandomGenerate}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Números: <strong>{randomSelection.join(", ")}</strong>
              </p>
              <input
                value={randomBuyer}
                onChange={(e) => setRandomBuyer(e.target.value)}
                placeholder="Comprador"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded"
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={randomPago}
                  onChange={(e) => setRandomPago(e.target.checked)}  
                />
                Pagado
              </label>
              <select
                value={randomMetodo}
                onChange={(e) => setRandomMetodo(e.target.value as any)}
                disabled={!randomPago}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowRandomModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-1 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRandomConfirm}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulario de edición masiva */}
      {selected.length > 0 && (
        <form
          onSubmit={handleBulkSubmit}
          className="bg-yellow-50 p-4 rounded border border-yellow-300 space-y-4"
        >
          <p className="text-sm text-gray-800">
            ✏️ Asignar <strong>{selected.length}</strong> números seleccionados
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              placeholder="Comprador"
              value={bulkBuyer}
              onChange={(e) => setBulkBuyer(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded"
            />
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded"
            >
              <option value="ocupado">Ocupado</option>
              <option value="disponible">Disponible</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={bulkPago}
                onChange={(e) => setBulkPago(e.target.checked)}
              />
              Pagado
            </label>
            <select
              value={bulkMetodo}
              onChange={(e) => setBulkMetodo(e.target.value as any)}
              disabled={!bulkPago}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
            </select>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Tabla de tickets */}
      <div className="overflow-x-auto bg-gray-100 p-4 rounded-lg">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-200">
            <tr>
              <th></th>
              <th className="p-3 text-left text-gray-700">Número</th>
              <th className="p-3 text-left text-gray-700">Status</th>
              <th className="p-3 text-left text-gray-700">Comprador</th>
              <th className="p-3 text-center text-gray-700">Pagado</th>
              <th className="p-3 text-left text-gray-700">Medio pago</th>
              <th className="p-3 text-center text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((t) => {
              const pending = edited[t._id] !== undefined;
              const current = { ...t, ...edited[t._id] };
              const isAvailable = current.status === "disponible";
              const isPaid = current.pago;
              const isSelected = selected.includes(t.number);

              return (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelected((prev) =>
                          isSelected
                            ? prev.filter((n) => n !== t.number)
                            : [...prev, t.number]
                        )
                      }
                    />
                  </td>
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
                    <select
                      value={current.paymentMethod}
                      disabled={isAvailable || !isPaid}
                      onChange={(e) =>
                        onFieldChange(
                          t._id,
                          "paymentMethod",
                          e.target.value
                        )
                      }
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-2 py-1 rounded disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
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

      {/* Listado de números no pagados con opción de marcar pago */}
      <div className="mt-6 bg-red-50 border border-red-300 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Números no pagados
        </h3>
        <ul className="list-disc list-inside text-gray-800 space-y-2">
          {tickets
            .filter((t) => t.status === "ocupado" && !t.pago)
            .map((t) => (
              <li key={t._id} className="flex items-center justify-between">
                <span>
                  <strong>#{t.number}</strong> — {t.buyer || "Sin comprador"}
                </span>

                {payingId === t._id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={payMethodLocal}
                      onChange={(e) =>
                        setPayMethodLocal(e.target.value as any)
                      }
                      className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                    <button
                      onClick={() => handleConfirmPay(t._id)}
                      className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm hover:bg-green-300"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setPayingId(null)}
                      className="px-2 py-1 rounded text-sm bg-gray-300 hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPayingId(t._id);
                      setPayMethodLocal("Transferencia");
                    }}
                    className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm hover:bg-green-300"
                  >
                    Marcar pagado
                  </button>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
