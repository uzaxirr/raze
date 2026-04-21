import { NextRequest, NextResponse } from "next/server";
import { sessions } from "../../../tma/sign/_store";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Common token mints
const MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  JLP: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
};

const DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  BONK: 5,
  JUP: 6,
  JLP: 6,
  WIF: 6,
};

function resolveMint(symbol: string): string | null {
  return MINTS[symbol.toUpperCase()] || null;
}

function toSmallestUnits(amount: number, symbol: string): number {
  const decimals = DECIMALS[symbol.toUpperCase()] ?? 9;
  return Math.round(amount * 10 ** decimals);
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

/**
 * Solana Pay Transaction Request endpoint.
 *
 * GET  → returns label + icon (wallet displays these)
 * POST → receives { account } → builds FRESH Jupiter swap tx → returns it
 */

// GET — wallet requests metadata
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessions.get(id);

  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json(
      { error: "session expired" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const label =
    session.type === "swap"
      ? `Swap ${session.inputAmount || ""} ${session.fromSymbol || ""} → ${session.toSymbol || ""}`
      : session.type === "sol_transfer"
        ? `Send ${session.inputAmount || ""} SOL`
        : `Send ${session.inputAmount || ""} ${session.fromSymbol || "tokens"}`;

  return NextResponse.json(
    {
      label,
      icon: "https://raze.fun/assets/imp-expressions/waving.png",
    },
    { headers: corsHeaders() }
  );
}

// POST — wallet sends account, we build a FRESH transaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessions.get(id);

  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json(
      { error: "session expired" },
      { status: 404, headers: corsHeaders() }
    );
  }

  if (session.status === "completed") {
    return NextResponse.json(
      { error: "already signed" },
      { status: 410, headers: corsHeaders() }
    );
  }

  const body = await req.json();
  const account = body.account;

  if (!account) {
    return NextResponse.json(
      { error: "missing account" },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    // For swaps, build a fresh transaction via Jupiter
    if (session.type === "swap" && session.fromSymbol && session.toSymbol && session.inputAmount) {
      const inputMint = resolveMint(session.fromSymbol);
      const outputMint = resolveMint(session.toSymbol);

      if (!inputMint || !outputMint) {
        // Fallback: return pre-built transaction if we can't resolve mints
        return returnPrebuilt(session);
      }

      const amount = toSmallestUnits(session.inputAmount, session.fromSymbol);
      const jupApiKey = process.env.JUPITER_API_KEY || process.env.NEXT_PUBLIC_JUPITER_API_KEY || "";

      // Step 1: Get fresh quote
      const quoteUrl = new URL("https://api.jup.ag/swap/v1/quote");
      quoteUrl.searchParams.set("inputMint", inputMint);
      quoteUrl.searchParams.set("outputMint", outputMint);
      quoteUrl.searchParams.set("amount", String(amount));
      quoteUrl.searchParams.set("slippageBps", "50");

      const headers: Record<string, string> = {};
      if (jupApiKey) headers["x-api-key"] = jupApiKey;

      const quoteRes = await fetch(quoteUrl.toString(), { headers });
      if (!quoteRes.ok) {
        console.error("[SolanaPay] Jupiter quote failed:", await quoteRes.text());
        return returnPrebuilt(session);
      }
      const quote = await quoteRes.json();

      // Step 2: Get fresh swap transaction as LEGACY (not versioned)
      // Phantom's Solana Pay implementation handles legacy txs better
      const swapRes = await fetch("https://api.jup.ag/swap/v1/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: account,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          asLegacyTransaction: true,
        }),
      });

      if (!swapRes.ok) {
        console.error("[SolanaPay] Jupiter swap failed:", await swapRes.text());
        return returnPrebuilt(session);
      }

      const swapData = await swapRes.json();
      const transaction = swapData.swapTransaction;

      if (!transaction) {
        console.error("[SolanaPay] No swapTransaction in response");
        return returnPrebuilt(session);
      }

      const label = `Swap ${session.inputAmount} ${session.fromSymbol} → ${session.toSymbol}`;

      // Mark session to prevent double-use
      session.status = "signing";

      return NextResponse.json(
        { transaction, message: `Raze: ${label}` },
        { headers: corsHeaders() }
      );
    }

    // For non-swap transactions, return pre-built
    return returnPrebuilt(session);
  } catch (e) {
    console.error("[SolanaPay] Error building transaction:", e);
    return returnPrebuilt(session);
  }
}

function returnPrebuilt(session: { unsignedTransaction?: string; fromSymbol?: string; toSymbol?: string; inputAmount?: number; type: string }) {
  if (!session.unsignedTransaction) {
    return NextResponse.json(
      { error: "no transaction data" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const label =
    session.type === "swap"
      ? `Swap ${session.inputAmount || ""} ${session.fromSymbol || ""} → ${session.toSymbol || ""}`
      : `Send ${session.inputAmount || ""} ${session.fromSymbol || ""}`;

  return NextResponse.json(
    {
      transaction: session.unsignedTransaction,
      message: `Raze: ${label}`,
    },
    { headers: corsHeaders() }
  );
}
