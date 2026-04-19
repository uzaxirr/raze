import { NextResponse } from "next/server";

// Public endpoint — returns waitlist counts for the referral landing page
// In production, this would query the database. For now, it calls the backend API.
export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend.railway.internal:7777";

    // Try to get real stats from backend
    // For now, return placeholder stats — the bot tracks the real numbers in PostgreSQL
    // TODO: Add a /waitlist/stats endpoint to the backend API

    return NextResponse.json({
      total: 0,
      approved: 0,
      active: 0,
    });
  } catch {
    return NextResponse.json({ total: 0, approved: 0, active: 0 });
  }
}
