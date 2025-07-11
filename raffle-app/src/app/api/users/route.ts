// File: src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { dbPromise } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

interface UserDoc {
  _id:       string;
  name:      string;
  email:     string;
  role:      "admin" | "user";
  password:  string;
  createdAt: Date;
}

// GET /api/users
export async function GET() {
  const db = await dbPromise;
  const users = await db
    .collection<UserDoc>("users")
    .find(
      {},
      {
        projection: { password: 0 }, // nunca devolvemos el hash
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(users);
}

// POST /api/users
export async function POST(request: Request) {
  // 1) Validamos el body
  const body = await request.json() as {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
  };

  const { name, email, password, role } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { message: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  const db = await dbPromise;

  // 2) Verificamos que no exista otro usuario con ese email
  const existing = await db
    .collection<UserDoc>("users")
    .findOne({ email });
  if (existing) {
    return NextResponse.json(
      { message: "Ya existe un usuario con ese email" },
      { status: 409 }
    );
  }

  // 3) Hasheamos la contraseña
  const hashed = await bcrypt.hash(password, 10);

  // 4) Creamos el nuevo documento
  const newUser: UserDoc = {
    _id:       uuidv4(),
    name,
    email,
    role,
    password:  hashed,
    createdAt: new Date(),
  };

  // 5) Insertamos en BD
  await db.collection<UserDoc>("users").insertOne(newUser);

  // 6) Respondemos sin la contraseña
  const { password: _removed, ...userSafe } = newUser;
  return NextResponse.json(userSafe, { status: 201 });
}
