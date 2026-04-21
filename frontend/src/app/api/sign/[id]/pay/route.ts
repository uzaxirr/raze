import { NextRequest, NextResponse } from "next/server";
import { sessions } from "../../../tma/sign/_store";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

/**
 * Solana Pay Transaction Request endpoint.
 *
 * GET  → returns label + icon (wallet displays these)
 * POST → receives { account } → returns the pre-built unsigned transaction
 *
 * QR code encodes: solana:https://raze.fun/api/sign/{id}/pay
 */

// GET — wallet requests metadata
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessions.get(id);

  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json({ error: "session expired" }, { status: 404, headers: corsHeaders() });
  }

  const label =
    session.type === "swap"
      ? `Swap ${session.inputAmount || ""} ${session.fromSymbol || ""} → ${session.toSymbol || ""}`
      : session.type === "sol_transfer"
        ? `Send ${session.inputAmount || ""} SOL`
        : `Send ${session.inputAmount || ""} ${session.fromSymbol || "tokens"}`;

  return NextResponse.json({
    label,
    icon: "https://raze.fun/assets/imp-expressions/waving.png",
  }, { headers: corsHeaders() });
}

// POST — wallet sends account, we return the unsigned transaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessions.get(id);

  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json({ error: "session expired" }, { status: 404, headers: corsHeaders() });
  }

  if (session.status === "completed") {
    return NextResponse.json({ error: "already signed" }, { status: 410, headers: corsHeaders() });
  }

  const body = await req.json();
  const account = body.account;

  if (!account) {
    return NextResponse.json({ error: "missing account" }, { status: 400, headers: corsHeaders() });
  }

  // Verify wallet matches
  if (session.walletAddress && account !== session.walletAddress) {
    return NextResponse.json(
      {
        error: `Wrong wallet. Expected ${session.walletAddress.slice(0, 8)}...${session.walletAddress.slice(-4)}`,
      },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (!session.unsignedTransaction) {
    return NextResponse.json(
      { error: "no transaction data" },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Return the pre-built unsigned transaction
  // The wallet will display it for approval, sign it, and broadcast
  const label =
    session.type === "swap"
      ? `Swap ${session.inputAmount || ""} ${session.fromSymbol || ""} → ${session.toSymbol || ""}`
      : `Send ${session.inputAmount || ""} ${session.fromSymbol || ""}`;

  return NextResponse.json({
    transaction: session.unsignedTransaction,
    message: `Raze: ${label}`,
  }, { headers: corsHeaders() });
}
