import { NextRequest, NextResponse } from "next/server";
import { sessions } from "../../_store";

// POST — mark signing session as completed with txHash
export async function POST(
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

  const body = await req.json();
  session.status = body.status || "completed";
  session.txHash = body.txHash;

  return NextResponse.json({ ok: true, status: session.status });
}
