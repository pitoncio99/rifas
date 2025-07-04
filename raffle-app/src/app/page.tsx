"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    // Intentamos verificar que la rifa exista antes de redirigir
    let res: Response;
    if (/^R\d+$/i.test(trimmed)) {
      res = await fetch(`/api/raffles?code=${encodeURIComponent(trimmed.toUpperCase())}`);
    } else {
      res = await fetch(`/api/raffles/${encodeURIComponent(trimmed)}`);
    }

    if (res.status === 404) {
      setError("Rifa no encontrada");
      return;
    }
    if (!res.ok) {
      setError("Error buscando la rifa");
      return;
    }

    // Redirige a /raffles/[id] (el param puede ser R1 o el UUID)
    router.push(`/raffles/${trimmed}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSearch}
        className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Buscar rifa
        </h1>

        <label className="block mb-4">
          <span className="text-gray-700">Código o ID de rifa</span>
          <input
            type="text"
            placeholder="Ej: R1 o 550e8400-e29b-41d4-a716-446655440000"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="
              mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50
              px-4 py-2 text-gray-700 placeholder-gray-500 placeholder-opacity-75
              focus:border-blue-500 focus:ring-1 focus:ring-blue-200
            "
            required
          />
        </label>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <button
          type="submit"
          className="
            w-full bg-blue-600 text-white py-2 rounded-lg
            hover:bg-blue-700 transition-colors duration-200
          "
        >
          Ver rifa
        </button>
      </form>
    </div>
  );
}
