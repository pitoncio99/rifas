// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Rifa App",
  description: "Visualiza el estado de tu rifa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Fondo gris claro y texto oscuro por defecto */}
      <body className="min-h-screen bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
