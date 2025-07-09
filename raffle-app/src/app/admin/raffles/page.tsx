// File: src/app/admin/raffles/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";

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

export default function AdminRafflesPage() {
  const router = useRouter();
  const { data: raffles, error, isLoading } = useSWR<Raffle[]>(
    "/api/raffles",
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slogan, setSlogan] = useState("");
  const [prize, setPrize] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [date, setDate] = useState("");

  if (error) {
    return <p className="p-8 text-red-600">Error cargando rifas.</p>;
  }
  if (isLoading || !raffles) {
    return <p className="p-8 text-gray-600">Cargando rifas…</p>;
  }

  const openForm = () => {
    setShowForm(true);
    setTitle("");
    setSlogan("");
    setPrize("");
    setPrice("");
    setDate("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slogan || !prize || price === "" || !date) {
      alert("Todos los campos son obligatorios.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slogan, prize, price, date }),
      });
      if (!res.ok) throw new Error("Error creando");
      const { id } = await res.json();
      router.push(`/admin/raffles/${id}`);
    } catch {
      alert("Error creando rifa");
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(`¿Eliminar la rifa "${name}"? Esta acción es irreversible.`)
    ) {
      return;
    }
    setBusy(true);
    await fetch(`/api/raffles/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Galería de Rifas</h1>
        <button
          onClick={openForm}
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Crear nueva rifa
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg"
        >
          <h2 className="text-xl font-semibold text-gray-900">Nueva Rifa</h2>

          <div>
            <label className="block mb-1 text-gray-900">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 placeholder-gray-500"
              placeholder="Ingresa el título"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-900">Eslogan</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 placeholder-gray-500"
              placeholder="Ingresa un eslogan"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-900">Premio</label>
            <input
              type="text"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 placeholder-gray-500"
              placeholder="e.g. Canasta con 50 alimentos"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-900">
              Precio por número
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded text-gray-900 placeholder-gray-500"
              placeholder="300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-900">Fecha de sorteo</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 placeholder-gray-500"
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={busy}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? "Creando…" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {raffles.map((r) => (
          <div key={r._id} className="relative bg-white rounded shadow p-6">
            <button
              onClick={() => handleDelete(r._id, r.title)}
              disabled={busy}
              className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Eliminar
            </button>

            <h2 className="text-xl font-semibold text-gray-900">{r.title}</h2>
            <p className="italic text-gray-600 mb-4">{r.slogan}</p>

            <ul className="text-gray-800 mb-6 space-y-1">
              <li>🎁 Premio: {r.prize}</li>
              <li>💵 Precio: ${r.price}</li>
              <li>🗓 Sorteo: {r.date ?? "—"}</li>
              <li className="text-sm text-gray-500">Código: {r.code}</li>
            </ul>

            <Link
              href={`/admin/raffles/${r._id}`}
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Gestionar números
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
