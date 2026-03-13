"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 5 horses — each gets a different sprite-cycle offset so they look independent
const HORSES = [0, 1, 2, 3, 4];

// Sprite geometry (scaled ×10)
const HORSE_H = 160;
const GAP = 12;
const COL_H = HORSES.length * HORSE_H + (HORSES.length - 1) * GAP; // 848px
const ROPE_W = 100;

export function HorseTransition({
  name,
  role,
  onDone,
}: {
  name: string;
  role: "user" | "admin";
  onDone: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Navigate after the herd finishes crossing (~7 s animation + 200 ms buffer)
  useEffect(() => {
    const t = setTimeout(onDone, 7300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = role === "admin";

  const overlay = (
    <div className="horse-overlay" aria-live="polite" aria-label="Đang chuyển trang">
      <div className="horse-herd-rig" aria-hidden="true">

        {/* Banner — trails behind on the LEFT */}
        <div className="horse-banner">
          <div className="horse-banner-strings">
            <span className="horse-banner-string" />
            <span className="horse-banner-string" />
          </div>

          <span className="horse-banner-subtitle">
            {isAdmin ? "👑 Admin · MLN Chatbot" : "🎓 MLN Chatbot"}
          </span>
          <span className="horse-banner-greeting">Xin chào, {name}!</span>

          <div className="horse-banner-fringe-row">
            {Array.from({ length: 14 }).map((_, j) => (
              <span key={j} className="horse-banner-fringe" />
            ))}
          </div>
        </div>

        {/* SVG rope fan — from banner center (x=0) to each horse (x=ROPE_W) */}
        <svg
          className="horse-rope-svg"
          width={ROPE_W}
          height={COL_H}
          viewBox={`0 0 ${ROPE_W} ${COL_H}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ropeGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
          {HORSES.map((i) => {
            const yHorse = i * (HORSE_H + GAP) + HORSE_H / 2;
            const yBanner = COL_H / 2;
            return (
              <line
                key={i}
                x1={0}      y1={yBanner}
                x2={ROPE_W} y2={yHorse}
                stroke="url(#ropeGrad)"
                strokeWidth={5 - i * 0.3}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Column of 5 horses — leads to the RIGHT */}
        <div className="horse-herd-horses">
          {HORSES.map((i) => (
            <div key={i} className="horse-body">
              <div
                className="horse-sprite"
                style={{ animationDelay: `${-(i * 0.07).toFixed(2)}s` }}
              />
              <span className="horse-dust horse-dust-1" aria-hidden="true">💨</span>
              <span className="horse-dust horse-dust-2" aria-hidden="true">💨</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
