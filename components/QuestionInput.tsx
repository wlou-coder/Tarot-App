"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  onSubmit: (question: string) => void;
}

export default function QuestionInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Small delay so the entrance animation settles first
    const t = setTimeout(() => textareaRef.current?.focus(), 600);
    return () => clearTimeout(t);
  }, []);

  const canSubmit = value.trim().length >= 3;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(value.trim());
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 30, backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <motion.div
        className="flex flex-col items-center gap-8 px-8 w-full max-w-md"
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Ornament */}
        <div
          className="text-3xl select-none"
          style={{ filter: "drop-shadow(0 0 14px rgba(251,191,36,0.55))", color: "rgba(251,191,36,0.7)" }}
        >
          ✦
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <p className="text-[10px] tracking-[0.45em] uppercase text-yellow-400/40">
            Before the cards speak
          </p>
          <h2
            className="text-lg font-light tracking-wide text-white/75 leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
          >
            What question guides your reading?
          </h2>
        </div>

        {/* Textarea */}
        <div className="w-full">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={3}
            placeholder="Speak your question to the oracle…"
            className="w-full resize-none bg-transparent text-center text-white/65 text-sm leading-loose tracking-wide outline-none placeholder:text-white/18"
            style={{
              fontFamily: "Georgia, serif",
              borderBottom: "1px solid rgba(251,191,36,0.25)",
              paddingBottom: "10px",
            }}
          />
        </div>

        {/* Submit button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-10 py-3 text-[10px] tracking-[0.35em] uppercase transition-all duration-500 rounded-sm"
          style={{
            color: canSubmit ? "rgba(251,191,36,0.85)" : "rgba(255,255,255,0.18)",
            border: `1px solid ${canSubmit ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`,
            background: canSubmit ? "rgba(251,191,36,0.05)" : "transparent",
          }}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
        >
          Reveal the cards
        </motion.button>

        <p className="text-[9px] tracking-[0.3em] text-white/12 uppercase">
          Press Enter to continue
        </p>
      </motion.div>
    </motion.div>
  );
}
