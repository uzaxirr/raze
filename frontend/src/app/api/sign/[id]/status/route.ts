import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { findReference, FindReferenceError } from "@solana/pay";
import { sessions } from "../../../tma/sign/_store";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessions.get(id);

  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json(
      { error: "session not found or expired" },
      { status: 404, headers: corsHeaders() }
    );
  }

  if (session.status === "completed" && session.txHash) {
    return NextResponse.json(
      { status: "confirmed", signature: session.txHash },
      { headers: corsHeaders() }
    );
  }

  if (!session.referenceKey) {
    return NextResponse.json(
      { status: "pending" },
      { headers: corsHeaders() }
    );
  }

  try {
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, { commitment: "confirmed" });
    const reference = new PublicKey(session.referenceKey);

    const signatureInfo = await findReference(connection, reference, {
      finality: "confirmed",
    });

    // Update session so subsequent polls return immediately
    session.status = "completed";
    session.txHash = signatureInfo.signature;

    return NextResponse.json(
      { status: "confirmed", signature: signatureInfo.signature },
      { headers: corsHeaders() }
    );
  } catch (e) {
    if (e instanceof FindReferenceError) {
      // Not found yet — normal during polling
      return NextResponse.json(
        { status: "pending" },
        { headers: corsHeaders() }
      );
    }
    console.error("[status] findReference error:", e);
    return NextResponse.json(
      { status: "pending" },
      { headers: corsHeaders() }
    );
  }
}
