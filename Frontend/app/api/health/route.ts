import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "ETicaret.Frontend",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  };

  return NextResponse.json(health);
}
