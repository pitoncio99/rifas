"use client";

import { FormEvent, useState } from "react";

interface Props {
  onCreate: (id: string) => void;
}

export default function CreateRaffleForm({ onCreate }: Props) {
  const [title, setTitle]   = useState("");
  const [slogan, setSlogan] = useState("");
  const [prize, setPrize]   = useState("");
  const [price, setPrice]   = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/raffles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slogan, prize, price }),
    });
    const { id } = await res.json();
    onCreate(id);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Crear nueva rifa
        </h2>

        <div className="space-y-4">
          {/* Título */}
          <label className="block">
            <span className="text-gray-700 font-medium">Título</span>
            <input
              type="text"
              placeholder="Ej: Rifa benéfica perritos"
              className="
                mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50
                px-4 py-2 text-gray-700
                placeholder-gray-500 placeholder-opacity-75
                focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none
              "
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </label>

          {/* Eslogan */}
          <label className="block">
            <span className="text-gray-700 font-medium">Eslogan</span>
            <input
              type="text"
              placeholder="Ej: ¡Un refugio para los perritos!"
              className="
                mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50
                px-4 py-2 text-gray-700
                placeholder-gray-500 placeholder-opacity-75
                focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none
              "
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              required
            />
          </label>

          {/* Premio */}
          <label className="block">
            <span className="text-gray-700 font-medium">Premio</span>
            <input
              type="text"
              placeholder="Ej: Canasta con 50 alimentos"
              className="
                mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50
                px-4 py-2 text-gray-700
                placeholder-gray-500 placeholder-opacity-75
                focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none
              "
              value={prize}
              onChange={e => setPrize(e.target.value)}
              required
            />
          </label>

          {/* Precio por número */}
          <label className="block">
            <span className="text-gray-700 font-medium">Precio por número</span>
            <input
              type="number"
              placeholder="300"
              className="
                mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50
                px-4 py-2 text-gray-700
                placeholder-gray-500 placeholder-opacity-75
                focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none
              "
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
          </label>
        </div>

        <button
          type="submit"
          className="
            mt-8 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg
            hover:bg-blue-700 transition-colors duration-200
          "
        >
          Crear rifa
        </button>
      </form>
    </div>
  );
}
