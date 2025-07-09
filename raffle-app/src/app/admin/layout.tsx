// File: src/app/admin/layout.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SignOutButton from "../../components/SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white shadow">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <SignOutButton />
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
