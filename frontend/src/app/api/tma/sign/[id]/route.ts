import { NextRequest, NextResponse } from "next/server";

// Import the sessions map from the parent route
// Note: In-memory store is shared within the same Next.js process
// For production, use Redis

// Re-declare the map here since Next.js isolates route modules
// Both routes run in the same Node process so we use a shared module
import { sessions } from "../_store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessions.get(id);

  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(id);
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  return NextResponse.json(session);
}
