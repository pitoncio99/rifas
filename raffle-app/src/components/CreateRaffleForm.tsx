// File: src/components/CreateRaffleForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRaffleForm() {
  const [title, setTitle] = useState("");
  const [slogan, setSlogan] = useState("");
  const [prize, setPrize] = useState("");
  const [price, setPrice] = useState<number>();
  const [date, setDate] = useState("");  // ← fecha nuevo campo
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/raffles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slogan, prize, price, date }),
    });
    if (res.ok) {
      const { code } = await res.json();
      router.push(`/raffles/${code}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ...tus inputs previos... */}
      <div>
        <label className="block text-gray-700">Fecha de sorteo</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Crear rifa
      </button>
    </form>
  );
}
