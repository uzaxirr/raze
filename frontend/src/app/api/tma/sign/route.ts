import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sessions, SESSION_TTL_MS, type SignSession } from "./_store";

// POST — create a new signing session
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sign-secret");
  const expected = process.env.RAZE_SIGN_SECRET || "raze-dev-secret";
  if (secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = randomUUID();
  const now = Date.now();

  const session: SignSession = {
    id,
    inputMint: body.inputMint,
    outputMint: body.outputMint,
    amount: body.amount,
    slippageBps: body.slippageBps || 50,
    walletAddress: body.walletAddress,
    signingMode: body.signingMode || "external",
    type: body.type || "swap",
    toAddress: body.toAddress,
    tokenMint: body.tokenMint,
    status: "pending",
    network: body.network || "mainnet",
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    fromSymbol: body.fromSymbol,
    toSymbol: body.toSymbol,
    outputAmount: body.outputAmount,
    priceImpact: body.priceImpact,
  };

  sessions.set(id, session);
  return NextResponse.json({ id, expiresAt: session.expiresAt });
}
