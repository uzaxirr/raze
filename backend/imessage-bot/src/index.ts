/**
 * Raze iMessage Bot — Spectrum SDK
 *
 * Receives iMessages via Spectrum Cloud, processes through the same
 * AgentOS backend as Telegram, sends replies with typing indicators,
 * tapback reactions, and message effects.
 */

import "dotenv/config";
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

// ── Config ──
const PROJECT_ID = process.env.SPECTRUM_PROJECT_ID!;
const PROJECT_SECRET = process.env.SPECTRUM_PROJECT_SECRET!;
const AGENTOS_URL = process.env.AGENTOS_BASE_URL || "http://localhost:7777";

if (!PROJECT_ID || !PROJECT_SECRET) {
  console.error("Missing SPECTRUM_PROJECT_ID or SPECTRUM_PROJECT_SECRET");
  process.exit(1);
}

// ── Agent call ──
async function callAgent(
  message: string,
  phone: string,
  sessionId: string
): Promise<string> {
  try {
    const form = new FormData();
    form.append("message", message);
    form.append("stream", "false");
    form.append("user_id", `imsg_${phone.replace(/\+/g, "")}`);
    form.append("session_id", sessionId);

    const resp = await fetch(`${AGENTOS_URL}/agents/bouncer/runs`, {
      method: "POST",
      body: form,
    });

    if (!resp.ok) {
      console.error(`AgentOS error: ${resp.status} ${await resp.text()}`);
      return "something went wrong. try again.";
    }

    const result = await resp.json();
    let content: string = result.content || "";

    // Strip internal tags
    content = content.replace(/\[THINK\w*\][\s\S]*?\[\/THINK\w*\]/g, "").trim();
    content = content.replace(/\[THINK\w*\][\s\S]*$/g, "").trim();
    content = content.replace(/\[BOUNCER_\w*\][\s\S]*/g, "").trim();

    // Strip markdown — iMessage shows raw symbols
    content = content.replace(/\*\*/g, "");           // bold
    content = content.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "$1"); // italic
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2"); // [text](url) → text: url
    content = content.replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*/g, "").trim()); // code blocks

    // Convert bubble separators to line breaks
    content = content.replace(/\|\|\|/g, "\n\n");

    return content || "something went wrong. try again.";
  } catch (err) {
    console.error("Agent call failed:", err);
    return "something went wrong. try again.";
  }
}

// ── Main ──
async function main() {
  console.log("Starting Raze iMessage bot...");

  const app = await Spectrum({
    projectId: PROJECT_ID,
    projectSecret: PROJECT_SECRET,
    providers: [imessage.config()],
  });

  console.log("Connected to Spectrum Cloud. Listening for iMessages...");

  const im = imessage(app);

  for await (const [space, message] of app.messages) {
    // Only handle text messages
    if (message.content.type !== "text") continue;

    const text = message.content.text.trim();
    if (!text) continue;

    const phone = message.sender?.id || "unknown";
    const phoneClean = phone.replace(/\+/g, "").replace(/-/g, "");
    const sessionId = `imsg_${phoneClean}`;

    console.log(`iMessage from ${phone}: ${text.slice(0, 50)}`);

    // Show typing indicator while agent processes
    await space.responding(async () => {
      const response = await callAgent(text, phone, sessionId);

      // Split on intentional bubble breaks (|||) from agent prompt
      // For remaining long text, split at ~400 chars on paragraph boundaries
      const bubbles: string[] = [];
      for (const segment of response.split("\n\n")) {
        const trimmed = segment.trim();
        if (!trimmed) continue;

        const last = bubbles[bubbles.length - 1];
        if (last && last.length + trimmed.length < 400) {
          bubbles[bubbles.length - 1] = last + "\n\n" + trimmed;
        } else {
          bubbles.push(trimmed);
        }
      }

      // Send each bubble with a small delay for natural feel
      for (let i = 0; i < bubbles.length; i++) {
        await space.send(bubbles[i]);
        if (i < bubbles.length - 1) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    });
  }
}

// ── Graceful shutdown ──
process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down...");
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
