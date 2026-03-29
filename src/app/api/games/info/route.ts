import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = `http://${process.env.API_HOST}:${process.env.API_PORT}`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const res = await fetch(`${API_BASE}/games/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
