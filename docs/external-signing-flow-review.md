# Raze External Transaction Signing — Full Technical Review Document

## For Reviewing Agents

You are reviewing the external transaction signing flow for **Raze**, a Solana AI agent that lives inside Telegram (@razeaii_bot, raze.fun). This document contains the complete implementation — every file, every code snippet, every design decision. Your job is to identify bugs, security issues, architectural problems, and suggest improvements.

**Do not ask for additional files. Everything you need is in this document.**

---

## 1. What Raze Is

Raze is a crypto trading assistant. Users chat with it in Telegram to swap tokens, send SOL, research wallets, etc. The AI agent calls MCP (Model Context Protocol) servers to execute Solana transactions.

**Two signing modes:**
- **Internal (Privy):** Server-managed wallet. Raze signs on behalf of the user. Zero friction.
- **External:** User's own wallet (Phantom, Backpack, etc.). User must sign each transaction themselves.

This document covers the **external signing flow** — the most complex part of the system.

---

## 2. The Problem We're Solving

When a user with an external wallet asks Raze to swap tokens:
1. The agent builds an unsigned transaction server-side
2. The user needs to sign it with their wallet
3. But they're in Telegram — no browser extensions, no direct wallet access

We need a bridge: a web page where the user connects their wallet and signs.

---

## 3. High-Level Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Telegram     │     │  Backend          │     │  Frontend           │
│  Bot (Python) │────▶│  MCP Servers      │     │  Next.js 16.2.2     │
│               │     │  (transaction-    │     │  raze.fun           │
│  Agno AI      │     │   executor)       │     │                     │
│  Framework    │     │                   │     │  /sign/[id]         │
│               │     │  Jupiter v2 API   │     │  /api/tma/sign/     │
│               │     │  Privy Signer     │     │  /api/sign/[id]/pay │
└──────┬───────┘     └──────────────────┘     └─────────────────────┘
       │                                              │
       │  create_signing_session()                    │
       │  POST raze.fun/api/tma/sign                  │
       │─────────────────────────────────────────────▶│
       │                                              │
       │  Returns session ID                          │
       │◀─────────────────────────────────────────────│
       │                                              │
       │  Bot sends raze.fun/sign/{id}                │
       │  link to user in Telegram                    │
       │                                              │
       │           ┌──────────────┐                   │
       │           │  User's      │   Scans QR or     │
       │           │  Wallet      │   WalletConnect   │
       │           │  (Phantom)   │◀─────────────────▶│
       │           └──────────────┘                   │
       │                                              │
       │  Bot receives confirmation                   │
       │◀─────────────────────────────────────────────│
       │  via Telegram Bot API sendMessage             │
```

---

## 4. Complete Flow Step-by-Step

### Step 1: User requests a swap in Telegram
```
User: "swap 1 USDC to SOL"
```

### Step 2: Agent calls swap_tokens MCP tool
The LLM reads session_state and calls the tool with these parameters:
```
swap_tokens(
    wallet_address="<from session_state>",
    from_token="USDC",
    to_token="SOL",
    amount=1.0,
    signing_mode="external"
)
```

### Step 3: MCP server builds unsigned transaction via Jupiter v2
File: `backend/mcp-servers/transaction-executor/server.py`

```python
@mcp.tool()
async def swap_tokens(
    wallet_address: str,
    from_token: str,
    to_token: str,
    amount: float,
    wallet_id: Optional[str] = None,
    slippage_bps: int = 50,
    network: str = "mainnet",
    signing_mode: str = "internal",
) -> Dict[str, Any]:
    # Resolve token symbols to mint addresses
    input_mint = resolve_token(from_token)
    output_mint = resolve_token(to_token)
    input_amount = amount_to_lamports(amount, from_token)

    # Call Jupiter v2 /order endpoint
    swap_result = await get_jupiter_client().get_swap_quote_and_transaction(
        input_mint=input_mint,
        output_mint=output_mint,
        amount=input_amount,
        user_public_key=wallet_address,
        slippage_bps=slippage_bps,
    )

    if signing_mode == "external":
        return {
            "status": "pending_signature",
            "type": "swap",
            "unsigned_transaction": swap_result["swap_transaction"],
            "request_id": swap_result.get("request_id"),
            "from_token": from_symbol,
            "to_token": to_symbol,
            "input_amount": amount,
            "output_amount": output_amount,
            "network": network,
            "price_impact": swap_result.get("price_impact_pct"),
        }
```

### Step 4: Jupiter v2 client
File: `backend/mcp-servers/transaction-executor/jupiter.py`

```python
JUPITER_API_URL = os.getenv("JUPITER_API_URL", "https://api.jup.ag/swap/v2")
JUPITER_API_KEY = os.getenv("JUPITER_API_KEY", "")
RAZE_REFERRAL_ACCOUNT = os.getenv("RAZE_REFERRAL_ACCOUNT", "5JZe6rRbXoDjxcie4JLemUdXYsJk2k5L1TA1yekNGqKw")
RAZE_REFERRAL_FEE_BPS = int(os.getenv("RAZE_REFERRAL_FEE_BPS", "200"))  # 2%

class JupiterClient:
    async def get_swap_quote_and_transaction(self, input_mint, output_mint, amount, user_public_key, slippage_bps=50):
        # GET /swap/v2/order
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": slippage_bps,
            "taker": user_public_key,
        }
        if RAZE_REFERRAL_ACCOUNT:
            params["referralAccount"] = RAZE_REFERRAL_ACCOUNT
            params["referralFee"] = str(RAZE_REFERRAL_FEE_BPS)

        response = await client.get(url, params=params, headers={"x-api-key": JUPITER_API_KEY})
        result = response.json()

        return {
            "quote": result,
            "input_amount": int(result.get("inAmount", "0")),
            "output_amount": int(result.get("outAmount", "0")),
            "price_impact_pct": result.get("priceImpactPct"),
            "swap_transaction": result.get("transaction"),  # base64 unsigned tx
            "request_id": result.get("requestId"),
        }

    async def execute_signed_transaction(self, signed_transaction, request_id):
        # POST /swap/v2/execute
        payload = {"signedTransaction": signed_transaction, "requestId": request_id}
        response = await client.post(url, json=payload, headers={"x-api-key": JUPITER_API_KEY})
        return {"signature": response.json().get("signature"), "status": "confirmed"}
```

### Step 5: Bot intercepts the tool result and creates a signing session
File: `backend/tg-bot/src/bot.py`

```python
# In the streaming response handler:
elif isinstance(event, ToolCallCompletedEvent) and event.tool:
    tool_result = event.tool.result or ""
    tool_name = event.tool.tool_name or ""
    if "pending_signature" in tool_result and tool_name in ("swap_tokens", "send_sol", "send_token"):
        result_data = json.loads(tool_result)
        if result_data.get("status") == "pending_signature":
            pending_swap_data = result_data

# After streaming completes:
sign_url = await create_signing_session(
    pending_swap_data, session_state, telegram_chat_id=update.message.chat.id
) if pending_swap_data else None

if sign_url:
    keyboard = [[InlineKeyboardButton("🔐 Sign Transaction", url=sign_url)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await bot_message.edit_text(text, reply_markup=reply_markup)
```

```python
async def create_signing_session(swap_params, session_state, telegram_chat_id=None):
    frontend_url = os.getenv("RAZE_FRONTEND_URL", "https://raze.fun")
    sign_secret = os.getenv("RAZE_SIGN_SECRET", "raze-dev-secret")

    payload = {
        "walletAddress": session_state.get("external_wallet_address") or session_state.get("wallet_address"),
        "signingMode": session_state.get("signing_mode", "external"),
        "network": session_state.get("solana_network", "mainnet"),
        "type": swap_params.get("type", "swap"),
        "unsignedTransaction": swap_params.get("unsigned_transaction", ""),
        "requestId": swap_params.get("request_id", ""),
        "fromSymbol": swap_params.get("from_token", ""),
        "toSymbol": swap_params.get("to_token", ""),
        "inputAmount": swap_params.get("input_amount", 0),
        "outputAmount": swap_params.get("output_amount", 0),
        "priceImpact": swap_params.get("price_impact", ""),
    }
    if telegram_chat_id is not None:
        payload["telegramChatId"] = telegram_chat_id

    resp = await client.post(
        f"{frontend_url}/api/tma/sign",
        json=payload,
        headers={"x-sign-secret": sign_secret},
    )
    if resp.status_code == 200:
        session_id = resp.json().get("id")
        return f"{frontend_url}/sign/{session_id}"
```

### Step 6: Frontend creates the session
File: `frontend/src/app/api/tma/sign/route.ts`

```typescript
import { Keypair } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  // Validate secret
  const secret = req.headers.get("x-sign-secret");
  const expected = process.env.RAZE_SIGN_SECRET || "raze-dev-secret";
  if (secret !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = randomUUID();
  const referenceKeypair = Keypair.generate();

  const session: SignSession = {
    id,
    type: body.type || "swap",
    unsignedTransaction: body.unsignedTransaction,
    requestId: body.requestId,
    walletAddress: body.walletAddress,
    signingMode: body.signingMode || "external",
    status: "pending",
    network: body.network || "mainnet",
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
    fromSymbol: body.fromSymbol,
    toSymbol: body.toSymbol,
    inputAmount: body.inputAmount,
    outputAmount: body.outputAmount,
    referenceKey: referenceKeypair.publicKey.toBase58(), // For on-chain detection
    telegramChatId: body.telegramChatId,
  };

  sessions.set(id, session); // In-memory Map
  return NextResponse.json({ id, expiresAt: session.expiresAt });
}
```

Session store interface:
```typescript
// frontend/src/app/api/tma/sign/_store.ts
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

export const sessions = new Map<string, SignSession>(); // IN-MEMORY — wiped on deploy
export const SESSION_TTL_MS = 10 * 60 * 1000;
```

### Step 7: User opens the sign page
File: `frontend/src/app/sign/[id]/page.tsx`

```typescript
export default async function SignPage({ params }: Props) {
  const { id } = await params;
  return (
    <WalletProvider>
      <SignClient id={id} />
    </WalletProvider>
  );
}
```

WalletProvider initializes Reown AppKit:
```typescript
// frontend/src/app/sign/[id]/WalletProvider.tsx
import { createAppKit } from "@reown/appkit";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana } from "@reown/appkit/networks";

if (!initialized && projectId) {
  createAppKit({
    adapters: [new SolanaAdapter()],
    networks: [solana],
    projectId,
    metadata: { name: "Raze", url: "https://raze.fun" },
    features: { analytics: false, email: false, socials: false },
  });
  initialized = true;
}
```

### Step 8: Sign page — two methods

The sign page offers two tabs:

**Tab A: Scan QR (Solana Pay)** — default
- QR encoded via `@solana/pay`'s `encodeURL` + `createQR`
- Encodes: `solana:https://raze.fun/api/sign/{id}/pay?label=Raze&message=Sign+transaction`
- User scans with Phantom's in-app scanner
- Frontend polls `/api/sign/{id}/status` every 2s for confirmation

**Tab B: Connect Wallet (WalletConnect)**
- Reown AppKit `<appkit-button />`
- User connects via WalletConnect relay
- Signs via `walletProvider.signTransaction(tx)`
- Broadcasts via Jupiter `/execute` or `sendRawTransaction`

### Step 9: Solana Pay endpoint — builds FRESH transaction
File: `frontend/src/app/api/sign/[id]/pay/route.ts`

```typescript
// GET — wallet requests metadata
export async function GET(req, { params }) {
  const session = sessions.get(id);
  return NextResponse.json({
    label: `Swap ${session.inputAmount} ${session.fromSymbol} → ${session.toSymbol}`,
    icon: "https://raze.fun/assets/imp-expressions/waving.png",
  }, { headers: corsHeaders() });
}

// POST — wallet sends {account}, we build FRESH transaction
export async function POST(req, { params }) {
  const { account } = await req.json();

  // Step 1: Fresh Jupiter quote
  const quoteUrl = new URL("https://api.jup.ag/swap/v1/quote");
  quoteUrl.searchParams.set("inputMint", inputMint);
  quoteUrl.searchParams.set("outputMint", outputMint);
  quoteUrl.searchParams.set("amount", String(amount));
  quoteUrl.searchParams.set("slippageBps", "50");
  const quote = await (await fetch(quoteUrl, { headers })).json();

  // Step 2: Fresh swap transaction — LEGACY format, with tracking + priority fees
  const swapBody = {
    quoteResponse: quote,
    userPublicKey: account,          // Wallet that scanned (feePayer)
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    asLegacyTransaction: true,       // Phantom Solana Pay handles legacy better
    prioritizationFeeLamports: "auto", // Auto priority fees for better landing
  };
  if (session.referenceKey) {
    swapBody.trackingAccount = session.referenceKey; // For on-chain detection
  }

  const swapData = await (await fetch("https://api.jup.ag/swap/v1/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": jupApiKey },
    body: JSON.stringify(swapBody),
  })).json();

  return NextResponse.json({
    transaction: swapData.swapTransaction,
    message: `Raze: Swap ${session.inputAmount} ${session.fromSymbol} → ${session.toSymbol}`,
  }, { headers: corsHeaders() });
}
```

**Key design decisions in this endpoint:**
1. **Fresh transaction** — NOT serving the pre-built tx from the session. The pre-built tx has a stale blockhash (built minutes ago when the bot responded). We call Jupiter FRESH with the scanning wallet's address as feePayer and get a current blockhash.
2. **Legacy format** — `asLegacyTransaction: true` because Phantom's Solana Pay implementation handles legacy transactions better than versioned ones. Versioned transactions caused "couldn't load" errors.
3. **trackingAccount** — Jupiter's parameter that embeds our `referenceKey` into the transaction as a non-signer account. This lets us detect the transaction on-chain via `findReference()`.
4. **prioritizationFeeLamports: "auto"** — Jupiter auto-calculates optimal priority fees. Without this, transactions were being dropped by validators.
5. **Jupiter v1 /quote + /swap** — NOT v2 /order. The v2 /order transactions are optimized for Jupiter's /execute pipeline. For Solana Pay, the wallet broadcasts directly via RPC, so we need a standard transaction from v1.
6. **No wallet address check** — We removed the wallet match check because Phantom sends whichever account is active. The transaction's feePayer enforces the correct signer anyway.

### Step 10: Wallet signs and broadcasts
After the POST handler returns the transaction:
1. Phantom deserializes it
2. Phantom replaces the blockhash (per Solana Pay spec)
3. Phantom shows "Approve" with transaction details
4. User taps Approve
5. Phantom signs and broadcasts via its own RPC
6. **Our server never sees the signature**

### Step 11: Confirmation detection via reference key polling
File: `frontend/src/app/api/sign/[id]/status/route.ts`

```typescript
import { findReference, FindReferenceError } from "@solana/pay";

export async function GET(_req, { params }) {
  const session = sessions.get(id);

  // Fast return if already confirmed
  if (session.status === "completed" && session.txHash) {
    return NextResponse.json({ status: "confirmed", signature: session.txHash });
  }

  if (!session.referenceKey) {
    return NextResponse.json({ status: "pending" });
  }

  try {
    const connection = new Connection(rpcUrl, { commitment: "confirmed" });
    const reference = new PublicKey(session.referenceKey);

    // findReference calls getSignaturesForAddress(referenceKey) internally
    const signatureInfo = await findReference(connection, reference, { finality: "confirmed" });

    // Found! Update session
    session.status = "completed";
    session.txHash = signatureInfo.signature;

    return NextResponse.json({ status: "confirmed", signature: signatureInfo.signature });
  } catch (e) {
    if (e instanceof FindReferenceError) {
      return NextResponse.json({ status: "pending" }); // Not found yet — normal
    }
    return NextResponse.json({ status: "pending" });
  }
}
```

The sign page polls this every 2 seconds:
```typescript
// In SignClient.tsx
useEffect(() => {
  if (state !== "details" || !session?.referenceKey || signMethod !== "qr") return;

  const interval = setInterval(async () => {
    if (Date.now() - qrPollingStartRef.current > 120_000) {
      clearInterval(interval); return; // Stop after 120s
    }
    const res = await fetch(`/api/sign/${id}/status`);
    const data = await res.json();
    if (data.status === "confirmed" && data.signature) {
      clearInterval(interval);
      setSignature(data.signature);
      setState("success");
      // Notify bot
      fetch(`/api/tma/sign/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", txHash: data.signature }),
      }).catch(() => {});
    }
  }, 2_000);

  return () => clearInterval(interval);
}, [state, session, signMethod, id]);
```

### Step 12: Bot notification
File: `frontend/src/app/api/tma/sign/[id]/complete/route.ts`

```typescript
export async function POST(req, { params }) {
  const session = sessions.get(id);
  const body = await req.json();
  session.status = body.status || "completed";
  session.txHash = body.txHash;

  // Fire-and-forget notification
  notifyBot(id, session.txHash, {
    telegramChatId: session.telegramChatId,
    type: session.type,
    fromSymbol: session.fromSymbol,
    toSymbol: session.toSymbol,
    inputAmount: session.inputAmount,
    outputAmount: session.outputAmount,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}

async function notifyBot(sessionId, txHash, opts) {
  if (opts.telegramChatId) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const message =
      `✅ *Swap confirmed!*\n` +
      `${opts.inputAmount} ${opts.fromSymbol} → ${opts.outputAmount} ${opts.toSymbol}\n` +
      `[View on Solscan](https://solscan.io/tx/${txHash})`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: opts.telegramChatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  }
}
```

---

## 5. WalletConnect Flow (Tab B: Connect Wallet)

When using WalletConnect instead of QR:

```typescript
// SignClient.tsx — handleSign callback
const handleSign = useCallback(async () => {
  // 1. Deserialize pre-built transaction from session
  const txBytes = Uint8Array.from(Buffer.from(session.unsignedTransaction, "base64"));
  let tx;
  try { tx = VersionedTransaction.deserialize(txBytes); }
  catch { tx = Transaction.from(txBytes); }

  // 2. Simulate
  const simulation = await conn.simulateTransaction(tx);
  if (simulation.value.err) throw new Error("Transaction would fail");

  // 3. Sign via AppKit
  const signed = await walletProvider.signTransaction(tx);
  const signedBase64 = Buffer.from(signed.serialize()).toString("base64");

  // 4. Broadcast — via Jupiter /execute if requestId exists, else direct RPC
  let sig;
  if (session.requestId) {
    const execRes = await fetch("https://api.jup.ag/swap/v2/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": JUPITER_API_KEY },
      body: JSON.stringify({ signedTransaction: signedBase64, requestId: session.requestId }),
    });
    sig = (await execRes.json()).signature;
  } else {
    sig = await conn.sendRawTransaction(signedBytes, { skipPreflight: true, maxRetries: 3 });
  }

  setSignature(sig);
  setState("success");

  // 5. Notify bot
  await fetch(`/api/tma/sign/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ status: "completed", txHash: sig }),
  });
}, [session, connected, walletProvider, walletMismatch, id]);
```

**Key difference from QR flow:**
- Uses the PRE-BUILT transaction from the session (not fresh)
- Signs via WalletConnect relay (not Solana Pay)
- Broadcasts via Jupiter /execute (not wallet's RPC)
- Wallet mismatch check is client-side (checks connected wallet vs session.walletAddress)

---

## 6. Known Issues and Observed Bugs

### Critical Security
1. **Hardcoded fallback secret** — `RAZE_SIGN_SECRET` falls back to `"raze-dev-secret"` if not set
2. **No auth on GET session** — Anyone with UUID can fetch unsigned tx, wallet address, referenceKey
3. **No auth on /complete** — Anyone can mark sessions as completed with fake txHash
4. **Jupiter API key in client JS** — `NEXT_PUBLIC_JUPITER_API_KEY` exposed in browser bundle

### Reliability
5. **In-memory session store** — `Map` wiped on every deploy. Sessions lost mid-signing.
6. **Flaky transaction landing** — Some transactions drop despite `prioritizationFeeLamports: "auto"`. One confirmed tx: user approved in Phantom but tx never landed on-chain (signature `5CLxr6cmuAm1RSDHukYPHKfaV8sUVqtmGRdmUJ1BQiDNcnprUKYXdArq5tGV9Dws1pgyRzfMZwDeAz7v3rMuecUw` returned null from getSignatureStatuses).
7. **Two Jupiter API versions** — Bot uses v2 `/order` (returns versioned tx), QR handler uses v1 `/quote+/swap` (returns legacy tx). Inconsistent.
8. **WalletConnect path uses stale tx** — Pre-built tx from session has old blockhash. May expire if user takes >90s.

### UX
9. **Jupiter wallet doesn't support Solana Pay** — QR scanning shows "Invalid SolanaPay QR code"
10. **Phantom flags raze.fun as unsafe** — Needs Blowfish whitelisting
11. **Bot notification doesn't go through agent** — Direct Telegram Bot API call, so the AI conversation doesn't know the swap completed
12. **Polling only works on QR tab** — If user switches to "connect wallet" tab, QR polling stops
13. **Bot sends inline button** — Opens in Telegram's in-app browser, which has issues with WalletConnect redirects from Jupiter wallet

### Architectural
14. **Token mint hardcoded map** — Only 7 tokens (SOL, USDC, USDT, BONK, JUP, JLP, WIF). Unknown tokens fall back to pre-built tx.
15. **No retry for dropped transactions** — If Phantom broadcasts and it drops, no recovery mechanism
16. **referenceKey not used in WalletConnect path** — Confirmation detection via polling only works for QR flow

---

## 7. Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| `JUPITER_API_KEY` | Backend + Frontend (server) | Jupiter API authentication |
| `JUPITER_API_URL` | Backend | `https://api.jup.ag/swap/v2` |
| `NEXT_PUBLIC_JUPITER_API_KEY` | Frontend (client) | Jupiter /execute in WalletConnect path |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Frontend (client) | Reown AppKit WalletConnect |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Frontend (both) | Solana RPC endpoint |
| `RAZE_SIGN_SECRET` | Backend + Frontend (server) | Session creation auth |
| `RAZE_FRONTEND_URL` | Backend | `https://raze.fun` |
| `RAZE_REFERRAL_ACCOUNT` | Backend | Jupiter Ultra referral: `5JZe6rRbXoDjxcie4JLemUdXYsJk2k5L1TA1yekNGqKw` |
| `RAZE_REFERRAL_FEE_BPS` | Backend | `200` (2%) |
| `TELEGRAM_BOT_TOKEN` | Frontend (server) | For direct bot notification |
| `HOSTNAME` | Frontend | `0.0.0.0` for Railway standalone |

---

## 8. File Map

| File | Language | Purpose |
|---|---|---|
| `backend/tg-bot/src/bot.py` | Python | `create_signing_session()`, ToolCallCompletedEvent interception, session state management |
| `backend/mcp-servers/transaction-executor/server.py` | Python | `swap_tokens()` MCP tool — balance checks, Jupiter call, returns pending_signature |
| `backend/mcp-servers/transaction-executor/jupiter.py` | Python | Jupiter v2 client — `/order` + `/execute` |
| `frontend/src/app/sign/[id]/page.tsx` | TypeScript | Server component — metadata, wraps with WalletProvider |
| `frontend/src/app/sign/[id]/SignClient.tsx` | TypeScript | Main client component — QR, WalletConnect, polling, all UI states |
| `frontend/src/app/sign/[id]/WalletProvider.tsx` | TypeScript | Reown AppKit initialization |
| `frontend/src/app/api/tma/sign/route.ts` | TypeScript | POST — create session with referenceKey |
| `frontend/src/app/api/tma/sign/_store.ts` | TypeScript | SignSession interface + in-memory Map |
| `frontend/src/app/api/tma/sign/[id]/route.ts` | TypeScript | GET — fetch session by ID |
| `frontend/src/app/api/tma/sign/[id]/complete/route.ts` | TypeScript | POST — mark completed + notify bot via Telegram |
| `frontend/src/app/api/sign/[id]/pay/route.ts` | TypeScript | Solana Pay GET/POST — fresh Jupiter tx with trackingAccount |
| `frontend/src/app/api/sign/[id]/status/route.ts` | TypeScript | GET — poll findReference() for on-chain confirmation |

---

## 9. Libraries Used

| Package | Version | Purpose |
|---|---|---|
| `@solana/web3.js` | ^1.98.4 | Solana SDK — Connection, PublicKey, Transaction, VersionedTransaction, Keypair |
| `@solana/pay` | ^0.2.6 | encodeURL, createQR, findReference, FindReferenceError |
| `@reown/appkit` | ^1.8.19 | createAppKit — WalletConnect modal |
| `@reown/appkit-adapter-solana` | ^1.8.19 | SolanaAdapter, useAppKitAccount, useAppKitProvider, useAppKitConnection |
| `next` | 16.2.2 | Next.js with Turbopack, standalone output |
| `agno` | 2.3.21 | Python AI agent framework |
| `httpx` | — | Python async HTTP client |
| `solders` | — | Python Solana SDK (Pubkey, Keypair) |

---

## 10. Questions for Review

### Architecture
1. Is the dual-API approach correct? (v2 /order for bot's pre-built tx, v1 /quote+/swap for QR's fresh tx) Or should both use the same API version?
2. Should we use Jupiter v2 `/build` instead of v1 `/swap` for the QR POST handler? `/build` is the Router path designed for self-managed broadcasting.
3. Is `trackingAccount` the right Jupiter parameter for embedding a reference key? The Perplexity research confirmed it, but is it available in v1 `/swap`?

### Security
4. What's the minimum viable auth for the session GET and /complete endpoints before production?
5. Should the `NEXT_PUBLIC_JUPITER_API_KEY` be moved to a server-side proxy to prevent client-side exposure?
6. Is the hardcoded `"raze-dev-secret"` fallback acceptable if we verify the env var is set on Railway?

### Transaction Reliability
7. Why are transactions flaky? We use `asLegacyTransaction: true` + `prioritizationFeeLamports: "auto"` + fresh blockhash from Jupiter. What else could cause drops?
8. Should we implement retry logic? If the transaction drops, should the sign page offer "try again" that rebuilds the transaction?
9. Is `asLegacyTransaction: true` limiting us? Some routes might only work with versioned transactions.

### Solana Pay
10. Is our Solana Pay implementation spec-compliant? (URL encoding, GET/POST response format, CORS headers)
11. Why does `trackingAccount` work in v1 `/swap` but the reference key detection via `findReference()` seems inconsistent?
12. Should we use `findReference` with `finality: "confirmed"` or `"finalized"` for the status polling?

### UX
13. What should happen if the user closes the browser after scanning the QR and approving in Phantom? The sign page loses context. Should confirmation be entirely server-side?
14. Should the bot notification go through the AI agent conversation instead of a direct Telegram Bot API call? That way the agent can respond contextually.
15. How should we handle the Jupiter wallet incompatibility with Solana Pay? Just hide "jupiter" from the supported wallets list?

### Session Persistence
16. Should we migrate the in-memory Map to PostgreSQL (already have it) or Redis? What's the minimum schema?
17. Is 10 minutes TTL appropriate? Solana blockhashes expire in ~90s, but users might take longer to scan.

---

## 11. Deployment

- **Platform:** Railway (Nixpacks for frontend, Docker for backend)
- **Frontend start command:** `HOSTNAME=0.0.0.0 node .next/standalone/server.js` (via `npm start` with postbuild script copying static files)
- **Domain:** raze.fun (Railway edge with Fastly CDN)
- **Services:** frontend, backend (AgentOS + MCP servers via supervisord), telegram-bot, PostgreSQL

---

*Document generated 2026-04-21. All code snippets are from the current production codebase.*
