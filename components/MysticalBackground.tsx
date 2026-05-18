"use client";


const PARTICLE_COUNT = 40;

// Simple seeded pseudo-random to keep particles stable across re-renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface ParticleConfig {
  size: number;
  x: number;
  duration: number;
  delay: number;
  opacity: number;
}

function makeParticles(count: number): ParticleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    size:     1 + seededRandom(i * 5 + 0) * 2,
    x:        seededRandom(i * 5 + 1) * 100,
    duration: 12 + seededRandom(i * 5 + 2) * 20,
    delay:    -(seededRandom(i * 5 + 3) * 20),
    opacity:  0.2 + seededRandom(i * 5 + 4) * 0.5,
  }));
}

const PARTICLES = makeParticles(PARTICLE_COUNT);

function Particle({ cfg }: { cfg: ParticleConfig }) {
  return (
    <div
      className="absolute rounded-full bg-yellow-300 pointer-events-none"
      style={{
        width: `${cfg.size}px`,
        height: `${cfg.size}px`,
        left: `${cfg.x}%`,
        bottom: "-4px",
        opacity: cfg.opacity,
        animation: `floatParticle ${cfg.duration}s ${cfg.delay}s linear infinite`,
      }}
    />
  );
}

function MagicCircle({ awakened }: { awakened: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <div
        className="relative flex items-center justify-center transition-all duration-1000"
        style={{
          width: 320,
          height: 320,
          opacity: awakened ? 0.7 : 0.25,
          filter: awakened ? "drop-shadow(0 0 24px rgba(168,85,247,0.6))" : "none",
        }}
      >
        {/* Outer rotating ring */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 320 320"
          style={{ animation: "spinSlow 30s linear infinite" }}
        >
          <circle cx="160" cy="160" r="155" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />
          <circle cx="160" cy="160" r="148" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="0.5" strokeDasharray="4 8" />
          {[0,45,90,135,180,225,270,315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = 160 + 152 * Math.cos(rad);
            const y = 160 + 152 * Math.sin(rad);
            return <circle key={deg} cx={x} cy={y} r="3" fill="rgba(251,191,36,0.6)" />;
          })}
        </svg>

        {/* Inner counter-rotating ring */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 320 320"
          style={{ animation: "spinSlow 20s linear infinite reverse" }}
        >
          <circle cx="160" cy="160" r="118" fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="1" strokeDasharray="6 6" />
          {/* Triangle */}
          <polygon
            points="160,48 264,220 56,220"
            fill="none"
            stroke="rgba(251,191,36,0.3)"
            strokeWidth="1"
          />
        </svg>

        {/* Static inner geometry */}
        <svg className="absolute inset-0" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r="72" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
          {/* Star of David-ish shape */}
          <polygon points="160,100 190,152 220,104 220,216 190,168 160,220 130,168 100,216 100,104 130,152" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="0.8" />
        </svg>

        {/* Center dot */}
        <div
          className="w-3 h-3 rounded-full bg-yellow-300"
          style={{
            boxShadow: awakened ? "0 0 20px 6px rgba(251,191,36,0.6)" : "0 0 8px 2px rgba(251,191,36,0.3)",
            transition: "box-shadow 1s ease",
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  awakened: boolean;
}

export default function MysticalBackground({ awakened }: Props) {

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #1a0533 0%, #0d001a 55%, #000000 100%)",
        }}
      />

      {/* Subtle nebula blobs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(circle, rgba(88,28,135,0.15) 0%, transparent 70%)",
          animation: "pulse 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          top: "20%",
          left: "10%",
          background:
            "radial-gradient(circle, rgba(59,7,100,0.1) 0%, transparent 70%)",
          animation: "pulse 9s ease-in-out 3s infinite",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((cfg, i) => (
        <Particle key={i} cfg={cfg} />
      ))}

      {/* Magic circle */}
      <MagicCircle awakened={awakened} />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
