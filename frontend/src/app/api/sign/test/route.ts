import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors });
}

// GET — Solana Pay metadata
export async function GET() {
  return NextResponse.json(
    {
      label: "Raze Test",
      icon: "https://raze.fun/icon.png",
    },
    { headers: cors }
  );
}

// POST — build a minimal SOL transfer (0.001 SOL to self)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = body.account;

    if (!account) {
      return NextResponse.json(
        { error: "missing account" },
        { status: 400, headers: cors }
      );
    }

    const connection = new Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );
    const payer = new PublicKey(account);

    const tx = new Transaction();
    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: payer,
        lamports: 1000, // 0.000001 SOL
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer;

    const serialized = tx.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    });

    return NextResponse.json(
      {
        transaction: serialized.toString("base64"),
        message: "Raze test transaction",
      },
      { headers: cors }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: cors }
    );
  }
}
