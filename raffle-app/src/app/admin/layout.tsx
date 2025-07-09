// File: src/app/admin/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect }         from "next/navigation";
import Link                 from "next/link";
import { authOptions }      from "../api/auth/[...nextauth]/route";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1) Obtenemos la sesión
  const session = await getServerSession(authOptions);

  // 2) Si no hay sesión, redirige al login
  if (!session) {
    redirect("/auth/login");
  }

  // 3) Si existe sesión pero no es admin, llévalo al home
  if (session.user.role !== "admin") {
    redirect("/");
  }

  // 4) Si es admin, renderiza la barra y el contenido
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-xl">Panel de Administración</span>
        <div className="space-x-4">
          <Link href="/admin/raffles" className="text-white hover:underline">
            Rifas
          </Link>
          <Link href="/admin/users" className="text-white hover:underline">
            Usuarios
          </Link>
          <Link
            href="/api/auth/signout"
            className="px-3 py-1 border border-white rounded hover:bg-white hover:text-blue-600 transition"
          >
            Cerrar sesión
          </Link>
        </div>
      </nav>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
