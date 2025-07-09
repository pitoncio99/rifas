"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      username: user,
      password: pass,
    });
    if (res?.error) {
      setError("Credenciales inválidas");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Admin Login
        </h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-800 mb-1">Usuario</label>
          <input
            type="text"
            placeholder="admin"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-800 mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
