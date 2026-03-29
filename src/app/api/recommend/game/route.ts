import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = `http://${process.env.API_HOST}:${process.env.API_PORT}`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const res = await fetch(`${API_BASE}/recommend/game`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const data = text ? JSON.parse(text) : { message: `Backend error ${res.status}` };
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
