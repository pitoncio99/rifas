import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Define MONGODB_URI en .env.local");
}
const DB_NAME = "rifas";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export const dbPromise: Promise<Db> = clientPromise.then((cl) =>
  cl.db(DB_NAME)
);
