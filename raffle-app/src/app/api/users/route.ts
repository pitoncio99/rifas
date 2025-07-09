// File: src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  password: string;
  createdAt: Date;
}

export async function GET() {
  const db = await dbPromise;
  const users = await db
    .collection<UserDoc>("users")
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { name, email, password, role } = await request.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { message: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  const db = await dbPromise;

  // Verificar email único
  const exists = await db.collection("users").findOne({ email });
  if (exists) {
    return NextResponse.json(
      { message: "Ya existe un usuario con ese email" },
      { status: 409 }
    );
  }

  // Hash de la contraseña
  const hashed = await bcrypt.hash(password, 10);

  const newUser: UserDoc = {
    _id: uuidv4(),
    name,
    email,
    role,
    password: hashed,
    createdAt: new Date(),
  };

  await db.collection("users").insertOne(newUser);

  // No devolvemos la contraseña
  const { password: _, ...userSafe } = newUser;
  return NextResponse.json(userSafe, { status: 201 });
}
