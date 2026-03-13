"use client";

import type { CSSProperties } from "react";

type LoadingSpriteSize = "sm" | "md" | "lg";

export function LoadingSprite({
  size = "md",
  className = "",
  durationMs = 850,
}: {
  size?: LoadingSpriteSize;
  className?: string;
  durationMs?: number;
}) {
  const style = {
    "--loading-spin-duration": `${durationMs}ms`,
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={`loading-sprite loading-sprite--${size} ${className}`.trim()}
      style={style}
    />
  );
}
