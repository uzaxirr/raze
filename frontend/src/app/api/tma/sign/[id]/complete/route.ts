import { NextRequest, NextResponse } from "next/server";
import { sessions } from "../../_store";

// POST — mark signing session as completed with txHash, then notify bot
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

  // Fire-and-forget notification to bot
  notifyBot(id, session.txHash ?? body.txHash, {
    telegramChatId: session.telegramChatId,
    callbackUrl: session.callbackUrl,
    type: session.type,
    fromSymbol: session.fromSymbol,
    toSymbol: session.toSymbol,
    inputAmount: session.inputAmount,
    outputAmount: session.outputAmount,
  }).catch((e) => console.error("[complete] notifyBot error:", e));

  return NextResponse.json({ ok: true, status: session.status });
}

async function notifyBot(
  sessionId: string,
  txHash: string | undefined,
  opts: {
    telegramChatId?: string | number;
    callbackUrl?: string;
    type?: string;
    fromSymbol?: string;
    toSymbol?: string;
    inputAmount?: number;
    outputAmount?: number;
  }
) {
  const payload = {
    sessionId,
    txHash,
    type: opts.type,
    fromSymbol: opts.fromSymbol,
    toSymbol: opts.toSymbol,
    inputAmount: opts.inputAmount,
    outputAmount: opts.outputAmount,
  };

  // Option A: POST to explicit callbackUrl provided by the bot
  if (opts.callbackUrl) {
    await fetch(opts.callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return;
  }

  // Option B: Send Telegram message directly using the bot token
  if (opts.telegramChatId) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn("[complete] TELEGRAM_BOT_TOKEN not set, cannot notify");
      return;
    }
    const typeLabel = opts.type === "swap" ? "Swap" : "Transfer";
    const detail =
      opts.type === "swap" && opts.fromSymbol && opts.toSymbol
        ? `${opts.inputAmount ?? ""} ${opts.fromSymbol} → ${opts.outputAmount ?? ""} ${opts.toSymbol}`
        : `${opts.inputAmount ?? ""} ${opts.fromSymbol ?? ""}`;
    const solscanUrl = txHash ? `https://solscan.io/tx/${txHash}` : "";
    const message =
      `✅ *${typeLabel} confirmed!*\n` +
      (detail ? `${detail}\n` : "") +
      (solscanUrl ? `[View on Solscan](${solscanUrl})` : "");

    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: opts.telegramChatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );
  }
}
