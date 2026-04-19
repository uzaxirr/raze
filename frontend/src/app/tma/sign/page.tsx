"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TMASignRouter() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setError("Session expired or invalid link"), 5000);

    function tryRoute() {
      // Read from URL params first (more reliable), then Telegram SDK
      const urlParams = new URLSearchParams(window.location.search);
      const tgParam = urlParams.get("tgWebAppStartParam") || urlParams.get("startapp") || urlParams.get("id");
      const tg = (window as any).Telegram?.WebApp;
      const unsafeParam = tg?.initDataUnsafe?.start_param;
      const id = tgParam || unsafeParam;

      if (id) {
        clearTimeout(timeout);
        router.replace(`/tma/sign/${encodeURIComponent(id)}`);
      } else if (!tg?.initDataUnsafe) {
        // Telegram SDK not ready yet, retry
        requestAnimationFrame(tryRoute);
      } else {
        setError("No session ID found");
      }
    }
    tryRoute();

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0B14",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12,
      color: "#6B6180", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 36 }}>⏰</div>
          <div style={{ color: "#FF6B6B", fontWeight: 700 }}>{error}</div>
          <div style={{ fontSize: 12 }}>go back to telegram and try again</div>
        </>
      ) : (
        "loading..."
      )}
    </div>
  );
}
