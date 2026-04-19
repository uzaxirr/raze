"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TMASignRouter() {
  const router = useRouter();

  useEffect(() => {
    // Get session ID from Telegram WebApp startapp parameter
    const tg = (window as any).Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param;

    if (startParam) {
      router.replace(`/tma/sign/${startParam}`);
    } else {
      // Fallback: check URL search params
      const params = new URLSearchParams(window.location.search);
      const id = params.get("startapp") || params.get("id");
      if (id) {
        router.replace(`/tma/sign/${id}`);
      }
    }
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0B14",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#6B6180", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
    }}>
      loading...
    </div>
  );
}
