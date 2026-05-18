"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AppState } from "@/hooks/useHandGesture";

interface Props {
  appState: AppState;
  drawnCount: number;
  handInCenter: boolean;
  palmOpen: boolean;
  isGrasping: boolean;
  inCooldown: boolean;
}

// ── Dimensions ────────────────────────────────────────────────────────────
const STACK_W  = 110;
const STACK_H  = 185;
const RING_W   = 90;   // card size in the spinning ring
const RING_H   = 150;
const RING_R   = 180;  // radius of the orbit
const FAN_N    = 8;    // cards in the ring

// ── Mini card back (used in the spinning ring) ────────────────────────────
function RingCard({ index, total }: { index: number; total: number }) {
  const angle  = (index / total) * 360;
  const rad    = ((angle - 90) * Math.PI) / 180; // start from top
  const x      = RING_R * Math.cos(rad);
  const y      = RING_R * Math.sin(rad);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top:  "50%",
        width: RING_W,
        height: RING_H,
        marginLeft: -RING_W / 2,
        marginTop:  -RING_H / 2,
        transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
      }}
    >
      <div
        className="w-full h-full rounded-lg flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1e0836 0%, #0d0020 100%)",
          border: "1px solid rgba(168,85,247,0.55)",
          boxShadow: "0 0 12px rgba(168,85,247,0.35)",
        }}
      >
        <svg width="44" height="44" viewBox="0 0 52 52" opacity={0.3}>
          <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(251,191,36,0.8)" strokeWidth="1" />
          <polygon points="26,5 47,39 5,39" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="1" />
          <polygon points="26,47 5,13 47,13" fill="none" stroke="rgba(168,85,247,0.7)" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

// ── Stacked deck (shown when no hand detected) ─────────────────────────────
function StackedDeck({ glow }: { glow: number }) {
  const backs = [
    { offset: -8, rotate: -5 },
    { offset: -4, rotate: -2 },
    { offset:  0, rotate:  0 },
  ];
  return (
    <motion.div
      className="relative"
      style={{ width: STACK_W, height: STACK_H }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {backs.map(({ offset, rotate }, i) => (
        <div
          key={i}
          className="absolute rounded-xl flex items-center justify-center"
          style={{
            inset: 0,
            transform: `translateY(${offset}px) rotate(${rotate}deg)`,
            background: "linear-gradient(135deg, #1e0836 0%, #0d0020 100%)",
            border: "1px solid rgba(168,85,247,0.5)",
            boxShadow: `0 0 ${16 * glow}px rgba(168,85,247,0.4)`,
          }}
        >
          {i === 2 && (
            <svg width="52" height="52" viewBox="0 0 52 52" opacity={0.25}>
              <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="0.8" />
              <polygon points="26,5 47,39 5,39" fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="0.8" />
              <polygon points="26,47 5,13 47,13" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="0.8" />
              <circle cx="26" cy="26" r="4" fill="rgba(251,191,36,0.45)" />
            </svg>
          )}
        </div>
      ))}
    </motion.div>
  );
}

export default function TarotDeck({ appState, drawnCount, handInCenter, palmOpen, isGrasping, inCooldown }: Props) {
  const isReading = appState === "reading";
  const spinning  = isReading && handInCenter && !inCooldown;

  // Spin speed: faster when palm is open (ready to grab), normal otherwise
  const spinDuration = palmOpen ? 4 : 7;

  return (
    <div className="flex flex-col items-center gap-6">

      {/* ── Main visual area ── */}
      <div className="relative flex items-center justify-center" style={{ width: 480, height: 480 }}>

        {/* Glow halo */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 420, height: 420,
            background: "radial-gradient(circle, rgba(88,28,135,0.25) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
          animate={{ opacity: spinning ? [0.6, 1, 0.6] : 0.3, scale: spinning ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Spinning ring — shown when hand is in center */}
        <AnimatePresence>
          {spinning && (
            <motion.div
              key="ring"
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Orbit ring */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: spinDuration, repeat: Infinity, ease: "linear" }}
              >
                {Array.from({ length: FAN_N }).map((_, i) => (
                  <RingCard key={i} index={i} total={FAN_N} />
                ))}
              </motion.div>

              {/* Grasp flash: ring pulses white when grasping */}
              <AnimatePresence>
                {isGrasping && (
                  <motion.div
                    key="grasp-flash"
                    className="absolute inset-0 rounded-full pointer-events-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.35, 0], scale: [0.8, 1.2, 1.4] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 65%)" }}
                  />
                )}
              </AnimatePresence>

              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.p
                  className="text-[9px] tracking-[0.3em] uppercase text-center"
                  style={{ color: isGrasping ? "rgba(251,191,36,0.9)" : "rgba(251,191,36,0.35)" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  {isGrasping ? "Pulling…" : palmOpen ? "Grasp to draw" : "Open your palm"}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stacked deck — shown when hand NOT in center or in cooldown */}
        <AnimatePresence>
          {!spinning && (
            <motion.div
              key="stack"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.45 }}
            >
              <StackedDeck glow={isReading ? 1.2 : 0.7} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Progress pips ── */}
      {isReading && (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 6, height: 6,
                background: i < drawnCount ? "rgba(251,191,36,0.85)" : "rgba(255,255,255,0.1)",
                boxShadow: i < drawnCount ? "0 0 8px rgba(251,191,36,0.6)" : "none",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Cooldown label ── */}
      <AnimatePresence>
        {isReading && inCooldown && (
          <motion.p
            key="cooldown"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[9px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(168,85,247,0.55)" }}
          >
            {drawnCount < 3 ? "Card drawn · reach again…" : ""}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Idle hint ── */}
      {isReading && !spinning && !inCooldown && (
        <motion.p
          className="text-[9px] tracking-[0.3em] uppercase text-center"
          style={{ color: "rgba(251,191,36,0.3)" }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Bring your hand to the deck
        </motion.p>
      )}
    </div>
  );
}
