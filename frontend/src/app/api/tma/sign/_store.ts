export interface SignSession {
  id: string;
  type: "swap" | "sol_transfer" | "token_transfer";
  unsignedTransaction?: string;
  requestId?: string;
  walletAddress: string;
  signingMode: string;
  toAddress?: string;
  status: "pending" | "connected" | "signing" | "completed" | "expired" | "failed";
  txHash?: string;
  network: string;
  createdAt: number;
  expiresAt: number;
  fromSymbol?: string;
  toSymbol?: string;
  inputAmount?: number;
  outputAmount?: number;
  priceImpact?: string;
  referenceKey?: string;
  telegramChatId?: string | number;
  callbackUrl?: string;
}

// Shared in-memory store — upgrade to Redis for production persistence
export const sessions = new Map<string, SignSession>();

// TTL: 10 minutes
export const SESSION_TTL_MS = 10 * 60 * 1000;

// Cleanup expired sessions
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now > session.expiresAt) {
        sessions.delete(id);
      }
    }
  }, 30_000);
}
