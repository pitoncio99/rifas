// File: src/app/admin/users/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  // Form state
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [role, setRole]           = useState<"admin" | "user">("user");
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  // SWR para la lista de usuarios
  const { data: users, error: usersErr, mutate } = useSWR<User[]>(
    "/api/users",
    fetcher
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message || "Error creando usuario");
      return;
    }

    // Limpiar formulario y revalidar lista
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    mutate();
  };

  if (usersErr) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <p className="text-red-600">Error cargando usuarios.</p>
      </div>
    );
  }
  if (!users) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <p className="text-gray-700">Cargando usuarios…</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Gestión de Usuarios
      </h1>

      {/* Formulario de creación */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-lg shadow-md max-w-sm mb-8"
      >
        <h2 className="text-xl font-medium text-gray-900 mb-4">
          Crear nuevo usuario
        </h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <label className="block mb-3">
          <span className="text-gray-800">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="block mb-3">
          <span className="text-gray-800">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="block mb-3">
          <span className="text-gray-800">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-800">Rol</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
            className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          {loading ? "Creando…" : "Crear"}
        </button>
      </form>

      {/* Tabla de usuarios */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-gray-900">Nombre</th>
              <th className="px-4 py-2 text-left text-gray-900">Email</th>
              <th className="px-4 py-2 text-left text-gray-900">Rol</th>
              <th className="px-4 py-2 text-center text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-2 text-gray-800">{u.name}</td>
                <td className="px-4 py-2 text-gray-800">{u.email}</td>
                <td className="px-4 py-2 text-gray-800 capitalize">{u.role}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
