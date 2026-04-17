import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * In-memory transaction store with TTL.
 * Ephemeral by design — unsigned transactions expire with their blockhash (~90s).
 * A DB table would be overkill for data that lives < 2 minutes.
 */
interface StoredTx {
  id: string;
  transaction: string; // base64 unsigned tx
  type: string; // sol_transfer | token_transfer | swap
  amount?: string;
  to?: string;
  fromToken?: string;
  toToken?: string;
  network: string;
  createdAt: number;
}

const txStore = new Map<string, StoredTx>();
const TTL_MS = 120_000; // 2 minutes

// Cleanup expired entries every 30s
setInterval(() => {
  const now = Date.now();
  for (const [id, tx] of txStore) {
    if (now - tx.createdAt > TTL_MS) txStore.delete(id);
  }
}, 30_000);

const SIGN_SECRET = process.env.RAZE_SIGN_SECRET || "raze-dev-secret";

/** POST /api/sign — store an unsigned transaction, return its ID */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("x-sign-secret");
    if (auth !== SIGN_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transaction, type, amount, to, fromToken, toToken, network } = body;

    if (!transaction || !type || !network) {
      return NextResponse.json(
        { error: "missing required fields: transaction, type, network" },
        { status: 400 }
      );
    }

    const id = randomUUID().slice(0, 8); // short ID for cleaner URLs
    const entry: StoredTx = {
      id,
      transaction,
      type,
      amount,
      to,
      fromToken,
      toToken,
      network,
      createdAt: Date.now(),
    };
    txStore.set(id, entry);

    return NextResponse.json({ id, expiresIn: TTL_MS / 1000 });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}

/** GET /api/sign?id=xxx — retrieve an unsigned transaction */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const tx = txStore.get(id);
  if (!tx) {
    return NextResponse.json({ error: "expired or not found" }, { status: 404 });
  }

  // Check TTL
  if (Date.now() - tx.createdAt > TTL_MS) {
    txStore.delete(id);
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  // Return tx data (without the secret fields)
  return NextResponse.json({
    id: tx.id,
    transaction: tx.transaction,
    type: tx.type,
    amount: tx.amount,
    to: tx.to,
    fromToken: tx.fromToken,
    toToken: tx.toToken,
    network: tx.network,
    expiresAt: tx.createdAt + TTL_MS,
  });
}
