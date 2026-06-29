import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "modern-edu",
    timestamp: new Date().toISOString(),
  });
}
