"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefObject } from "react";
import { GestureData, AppState } from "@/hooks/useHandGesture";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  gestureData: GestureData;
  appState: AppState;
  drawnCount: number;
}

function Dot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
        style={{
          background: active ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.12)",
          boxShadow: active ? "0 0 5px rgba(251,191,36,0.7)" : "none",
        }}
      />
      <span className="text-[9px] tracking-widest uppercase text-white/25">{label}</span>
    </div>
  );
}

const HINTS: Record<AppState, string> = {
  idle:     "Begin your reading when you are ready",
  question: "Ask the question that weighs on your heart",
  reading:  "Open your palm and hold still to draw a card",
  revealed: "The oracle has spoken",
};

export default function GestureOverlay({ videoRef, gestureData, appState, drawnCount }: Props) {
  const { handDetected, handInCenter, palmOpen, inCooldown, cameraReady, error } = gestureData;

  return (
    <>
      {/* Camera preview — top left */}
      <div
        className="fixed top-4 left-4 rounded-lg overflow-hidden"
        style={{
          width: 96,
          height: 72,
          border: `1px solid ${handDetected ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.06)"}`,
          zIndex: 50,
          boxShadow: handDetected ? "0 0 12px rgba(168,85,247,0.4)" : "none",
          transition: "border-color 0.4s, box-shadow 0.4s",
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          muted
          playsInline
        />
        {!cameraReady && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="text-[8px] text-white/30 text-center px-1">
              {error ?? "Loading…"}
            </span>
          </div>
        )}
      </div>

      {/* Status dots — below preview */}
      <div className="fixed top-[92px] left-4 space-y-1" style={{ zIndex: 50 }}>
        <Dot active={handDetected} label="Hand"   />
        <Dot active={handInCenter} label="Center" />
        <Dot active={palmOpen}     label="Palm"   />
        <Dot active={gestureData.isGrasping} label="Grasp" />
      </div>

      {/* Charge bar — thin strip at very bottom */}
      {appState === "reading" && (
        <div
          className="fixed bottom-0 left-0 right-0"
          style={{ zIndex: 50, height: 2, background: "rgba(255,255,255,0.04)" }}
        >
          <motion.div
            className="h-full"
            style={{
              background: inCooldown
                ? "linear-gradient(90deg, rgba(168,85,247,0.6), rgba(168,85,247,0.3))"
                : "linear-gradient(90deg, rgba(251,191,36,0.8), rgba(251,191,36,0.4))",
            }}
            animate={{ width: inCooldown ? "100%" : gestureData.isGrasping ? "60%" : "0%" }}
            transition={{ duration: 0.12, ease: "linear" }}
          />
        </div>
      )}

      {/* Hint text — bottom centre */}
      <div
        className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none"
        style={{ zIndex: 50 }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={`${appState}-${drawnCount}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5 }}
            className="text-[10px] tracking-[0.2em] text-white/22 text-center"
          >
            {appState === "reading" && drawnCount > 0
              ? `${drawnCount} of 3 cards drawn`
              : HINTS[appState]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Hand position dot */}
      <AnimatePresence>
        {gestureData.handPosition && appState === "reading" && (
          <motion.div
            key="hand-dot"
            className="fixed pointer-events-none rounded-full"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 0.45, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            style={{
              width: 40,
              height: 40,
              left: `calc(${gestureData.handPosition.x * 100}% - 20px)`,
              top:  `calc(${gestureData.handPosition.y * 100}% - 20px)`,
              border: "1px solid rgba(251,191,36,0.55)",
              boxShadow: "0 0 10px rgba(251,191,36,0.25)",
              zIndex: 45,
            }}
          />
        )}
      </AnimatePresence>

      {/* Error / loading banners */}
      <AnimatePresence>
        {!cameraReady && !error && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-16 left-0 right-0 flex justify-center"
            style={{ zIndex: 50 }}
          >
            <p className="text-[9px] tracking-widest text-purple-400/40 uppercase animate-pulse">
              Initialising gesture oracle…
            </p>
          </motion.div>
        )}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-16 left-0 right-0 flex justify-center"
            style={{ zIndex: 50 }}
          >
            <p className="text-[9px] tracking-widest text-red-400/50">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
