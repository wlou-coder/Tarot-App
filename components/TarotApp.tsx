"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHandGesture, AppState } from "@/hooks/useHandGesture";
import { drawThreeCards, TarotCard as TarotCardType } from "@/lib/tarotData";
import { generateReading, type CardReading } from "@/lib/interpretationEngine";
import MysticalBackground from "@/components/MysticalBackground";
import TarotDeck from "@/components/TarotDeck";
import TarotCard from "@/components/TarotCard";
import GestureOverlay from "@/components/GestureOverlay";
import QuestionInput from "@/components/QuestionInput";

const POSITIONS: Array<"past" | "present" | "future"> = ["past", "present", "future"];

export default function TarotApp() {
  const [appState, setAppState]     = useState<AppState>("idle");
  const [question, setQuestion]     = useState("");
  const [drawnCards, setDrawnCards] = useState<TarotCardType[]>([]);
  const [readings, setReadings]     = useState<CardReading[]>([]);
  const [flipped, setFlipped]       = useState([false, false, false]);
  const [cardPool]                  = useState(() => drawThreeCards()); // stable for session

  // Keep refs so the gesture callback always sees the latest values
  const drawnRef    = useRef(drawnCards);
  drawnRef.current  = drawnCards;
  const questionRef = useRef(question);
  questionRef.current = question;

  // ── Card draw callback (called by gesture hook) ───────────────────────────
  const onCardDraw = useCallback(() => {
    const current = drawnRef.current;
    if (current.length >= 3) return;

    const next = [...current, cardPool[current.length]];
    setDrawnCards(next);

    if (next.length === 3) {
      const three = next as [TarotCardType, TarotCardType, TarotCardType];
      const r = generateReading(questionRef.current, three);
      setReadings(r);
      setTimeout(() => {
        setAppState("revealed");
        setTimeout(() => setFlipped([true, false, false]), 700);
        setTimeout(() => setFlipped([true, true, false]), 1600);
        setTimeout(() => setFlipped([true, true, true]),  2500);
      }, 900);
    }
  }, [cardPool]);

  const { videoRef, gestureData } = useHandGesture(appState, onCardDraw);

  // ── State transitions ─────────────────────────────────────────────────────
  const handleBegin = useCallback(() => setAppState("question"), []);

  const handleQuestionSubmit = useCallback((q: string) => {
    setQuestion(q);
    setAppState("reading");
  }, []);

  const handleReset = useCallback(() => {
    setAppState("idle");
    setQuestion("");
    setDrawnCards([]);
    setReadings([]);
    setFlipped([false, false, false]);
  }, []);

  // ── Derived display flags ─────────────────────────────────────────────────
  const showDeck  = appState === "reading";
  const showCards = (appState === "reading" && drawnCards.length > 0) || appState === "revealed";

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      <MysticalBackground awakened={appState !== "idle"} />

      {/* ── Title ── */}
      <motion.header
        className="absolute top-6 left-0 right-0 text-center pointer-events-none"
        style={{ zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <p
          className="text-xs tracking-[0.5em] uppercase font-light"
          style={{ color: "rgba(251,191,36,0.45)" }}
        >
          The Oracle
        </p>
      </motion.header>

      {/* ── Reset ── */}
      <button
        onClick={handleReset}
        className="absolute top-5 right-5 text-[10px] tracking-[0.25em] uppercase px-4 py-2 rounded-full transition-all duration-300"
        style={{
          zIndex: 60,
          color: "rgba(251,191,36,0.4)",
          border: "1px solid rgba(251,191,36,0.18)",
          background: "rgba(0,0,0,0.4)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(251,191,36,0.8)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(251,191,36,0.4)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.18)";
        }}
      >
        Reset
      </button>

      {/* ── Main stage ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>

        {/* Idle screen */}
        <AnimatePresence>
          {appState === "idle" && (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7 }}
            >
              {/* Rotating idle deck */}
              <TarotDeck
                appState={appState}
                drawnCount={0}
                handInCenter={false}
                palmOpen={false}
                isGrasping={false}
                inCooldown={false}
              />
              <motion.button
                onClick={handleBegin}
                className="text-[11px] tracking-[0.4em] uppercase px-8 py-3"
                style={{
                  color: "rgba(251,191,36,0.65)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: "2px",
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Begin your reading
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reading stage: deck + drawn cards */}
        <AnimatePresence>
          {showDeck && (
            <motion.div
              key="reading-deck"
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8 }}
            >
              <TarotDeck
                appState={appState}
                drawnCount={drawnCards.length}
                handInCenter={gestureData.handInCenter}
                palmOpen={gestureData.palmOpen}
                isGrasping={gestureData.isGrasping}
                inCooldown={gestureData.inCooldown}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards drawn so far (during reading) */}
        <AnimatePresence>
          {showCards && drawnCards.length > 0 && appState === "reading" && (
            <motion.div
              key="reading-cards"
              className="absolute bottom-8 flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {drawnCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.7, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  <div
                    className="w-14 h-24 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #1e0836 0%, #0d0020 100%)",
                      border: "1px solid rgba(251,191,36,0.4)",
                      boxShadow: "0 0 16px rgba(168,85,247,0.4)",
                    }}
                  >
                    <span className="text-xl">{card.symbol}</span>
                  </div>
                  <p className="text-[8px] tracking-widest text-yellow-400/40 uppercase mt-1">
                    {POSITIONS[i]}
                  </p>
                </motion.div>
              ))}

              {/* Remaining slots */}
              {Array.from({ length: 3 - drawnCards.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-14 h-24 rounded-lg"
                  style={{
                    border: "1px dashed rgba(255,255,255,0.08)",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revealed: full three-card spread */}
        <AnimatePresence>
          {appState === "revealed" && (
            <motion.div
              key="revealed"
              className="flex flex-col items-center gap-8 w-full px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Question echo */}
              <motion.p
                className="text-center text-white/25 text-xs italic tracking-wider max-w-sm"
                style={{ fontFamily: "Georgia, serif" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                "{question}"
              </motion.p>

              {/* Cards */}
              <div className="flex items-start gap-4 md:gap-8 flex-wrap justify-center">
                {drawnCards.map((card, i) => (
                  <TarotCard
                    key={card.id}
                    card={card}
                    position={POSITIONS[i]}
                    revealed
                    flipped={flipped[i]}
                    delay={i * 0.2}
                    question={question}
                    reading={readings[i]}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Question overlay ── */}
      <AnimatePresence>
        {appState === "question" && (
          <QuestionInput key="q" onSubmit={handleQuestionSubmit} />
        )}
      </AnimatePresence>

      {/* ── Camera + gesture feedback ── */}
      <GestureOverlay
        videoRef={videoRef}
        gestureData={gestureData}
        appState={appState}
        drawnCount={drawnCards.length}
      />
    </div>
  );
}
