"use client";

import Script from "next/script";
import { useEffect } from "react";
import { AppKitProvider } from "./appkit-provider";

function TelegramBoot() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
  }, []);

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js?62"
      strategy="beforeInteractive"
    />
  );
}

export default function TMALayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TelegramBoot />
      <AppKitProvider>
        {children}
      </AppKitProvider>
    </>
  );
}
