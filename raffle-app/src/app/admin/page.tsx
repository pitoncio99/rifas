import Link from "next/link";

export default async function AdminPage() {
  // Se muestra un enlace a la galería de rifas
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Administrar Rifas</h2>
      <Link
        href="/admin/raffles"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Ver galerío de rifas
      </Link>
    </div>
  );
}
