#!/usr/bin/env python3
"""
Entry point for Helius Webhook Receiver service.
"""
import os
import uvicorn

PORT = int(os.getenv("PORT", os.getenv("WEBHOOK_RECEIVER_PORT", "8010")))

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info"
    )
