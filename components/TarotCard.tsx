"use client";

import { motion } from "framer-motion";
import { TarotCard as TarotCardType } from "@/lib/tarotData";
import { type CardReading } from "@/lib/interpretationEngine";

interface Props {
  card: TarotCardType;
  position: "past" | "present" | "future";
  revealed: boolean;
  flipped: boolean;
  delay?: number;
  question?: string;
  reading?: CardReading;
}

const LABELS: Record<Props["position"], string> = {
  past:    "Past",
  present: "Present",
  future:  "Future",
};

const GLOWS: Record<Props["position"], string> = {
  past:    "rgba(99,102,241,0.5)",
  present: "rgba(168,85,247,0.5)",
  future:  "rgba(245,158,11,0.5)",
};

const CARD_W = 148;
const CARD_H = 260;

export default function TarotCard({ card, position, revealed, flipped, delay = 0, reading }: Props) {
  const glow = GLOWS[position];

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Position label */}
      <motion.p
        className="text-[10px] tracking-[0.35em] uppercase font-light"
        style={{ color: "rgba(251,191,36,0.5)" }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : -6 }}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        {LABELS[position]}
      </motion.p>

      {/* 3-D flip card */}
      <motion.div
        style={{ width: CARD_W, height: CARD_H, perspective: 1000 }}
        initial={{ opacity: 0, scale: 0.8, y: 36 }}
        animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.8, y: revealed ? 0 : 36 }}
        transition={{ delay, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ delay: delay + 0.35, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* ── Back face ── */}
          <div
            className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #1e0836 0%, #0d0020 100%)",
              border: "1px solid rgba(168,85,247,0.4)",
              boxShadow: `0 0 28px ${glow}, 0 0 56px rgba(88,28,135,0.25)`,
            }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" opacity={0.28}>
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="0.8" />
              <polygon points="40,8 72,60 8,60"  fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="0.8" />
              <polygon points="40,72 8,20 72,20" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="0.8" />
              <circle cx="40" cy="40" r="7" fill="rgba(251,191,36,0.45)" />
            </svg>
          </div>

          {/* ── Front face ── */}
          <div
            className="absolute inset-0 rounded-xl flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(160deg, #1a0533 0%, #0a001a 60%, #0d0020 100%)",
              border: "1px solid rgba(251,191,36,0.32)",
              boxShadow: `0 0 36px ${glow}, 0 0 72px rgba(88,28,135,0.35)`,
            }}
          >
            {/* Top accent bar */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }} />

            {/* Roman numeral */}
            <p className="text-center text-yellow-400/35 text-[10px] tracking-widest mt-2">{card.romanNumeral}</p>

            {/* Symbol */}
            <div className="flex-1 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
                  border: "1px solid rgba(251,191,36,0.18)",
                }}
              >
                <span className="text-3xl select-none" style={{ filter: `drop-shadow(0 0 7px ${glow})` }}>
                  {card.symbol}
                </span>
              </div>
            </div>

            {/* Card info */}
            <div className="px-3 pb-3 space-y-1.5">
              <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, rgba(251,191,36,0.28), transparent)` }} />
              <p className="text-yellow-300 text-[10px] text-center font-medium tracking-[0.2em] uppercase">
                {card.name}
              </p>
              <p className="text-purple-300/50 text-[8px] text-center leading-relaxed">
                {card.upright}
              </p>
            </div>

            {/* Bottom accent bar */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }} />
          </div>
        </motion.div>
      </motion.div>

      {/* Interpretation — appears after flip */}
      <motion.div
        className="text-center space-y-2 max-w-[160px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: flipped ? 1 : 0 }}
        transition={{ delay: delay + 1.1, duration: 0.9 }}
      >
        {reading ? (
          <>
            {reading.isReversed && (
              <p className="text-[7px] tracking-[0.2em] uppercase text-red-400/50">
                {reading.reversedNote}
              </p>
            )}
            <p className="text-[8px] tracking-[0.2em] uppercase text-yellow-400/35">
              {reading.intro}
            </p>
            <p className="text-purple-200/55 text-[10px] leading-relaxed italic" style={{ fontFamily: "Georgia, serif" }}>
              {reading.meaning}
            </p>
            <p className="text-purple-300/35 text-[9px] leading-relaxed">
              {reading.reflection}
            </p>
          </>
        ) : (
          <p className="text-purple-200/45 text-[10px] leading-relaxed italic" style={{ fontFamily: "Georgia, serif" }}>
            {card.upright}
          </p>
        )}
      </motion.div>
    </div>
  );
}
