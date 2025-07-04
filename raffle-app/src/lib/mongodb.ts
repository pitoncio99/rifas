// File: src/lib/mongodb.ts

import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Define MONGODB_URI en .env.local");
}

// Nombre fijo de tu base de datos
const DB_NAME = "rifas";

// Creamos el cliente y la promesa de conexión
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

// Exportamos una promesa que resuelve directamente al objeto Db ya apuntando a "rifas"
export const dbPromise: Promise<Db> = clientPromise.then((cl) =>
  cl.db(DB_NAME)
);
