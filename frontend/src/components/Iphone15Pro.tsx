"use client";

import { useEffect, useRef } from "react";

export interface IphoneMockupProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  mode?: "light" | "dark";
}

/**
 * iPhone mockup using @sneas/telephone web component.
 * Renders a pixel-perfect iPhone 16 Max SVG frame around any HTML content.
 */
export default function IphoneMockup({
  children,
  className,
  style,
  mode = "light",
}: IphoneMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const registered = useRef(false);

  useEffect(() => {
    // Register the web component once (client-side only)
    if (!registered.current) {
      import("@sneas/telephone/iphone-16-max.js").catch(() => {});
      registered.current = true;
    }
  }, []);

  return (
    <div ref={containerRef} className={className} style={style}>
      {/* @ts-expect-error — web component not in JSX intrinsic elements */}
      <iphone-16-max mode={mode} style={{ display: "block", width: "100%" }}>
        {children}
        {/* @ts-expect-error — closing web component tag */}
      </iphone-16-max>
    </div>
  );
}
