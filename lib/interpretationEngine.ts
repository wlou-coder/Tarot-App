import type { TarotCard } from "./tarotData";

export type QuestionCategory =
  | "love"
  | "career"
  | "money"
  | "home"
  | "spiritual"
  | "general";

// ── Question classification ─────────────────────────────────────────────────

export function categorizeQuestion(question: string): QuestionCategory {
  const t = question.toLowerCase();
  if (/\b(love|relationship|partner|romance|dating|marriage|boyfriend|girlfriend|husband|wife|heart|feeling|together|apart|breakup|break.?up|soulmate|date|crush|divorce|ex|attraction|affection)\b/.test(t))
    return "love";
  if (/\b(career|job|work|business|profession|boss|promotion|interview|fired|hired|colleague|office|employment|startup|company|role)\b/.test(t))
    return "career";
  if (/\b(money|financial|finance|debt|savings|investment|income|salary|bills|afford|cash|expense|budget|wealthy|broke|loan|rent)\b/.test(t))
    return "money";
  if (/\b(home|house|family|moving|apartment|move|mother|father|parent|child|sibling|domestic|kids|children|divorce|custody)\b/.test(t))
    return "home";
  if (/\b(spiritual|soul|purpose|meaning|universe|destiny|path|guidance|intuition|divine|meditation|energy|sign|faith|god|healing)\b/.test(t))
    return "spiritual";
  return "general";
}

// ── Per-position framing sentences ─────────────────────────────────────────

type Position = "past" | "present" | "future";

const FRAMES: Record<Position, Record<QuestionCategory, string>> = {
  past: {
    love:     "Shaping the emotional ground you stand on",
    career:   "Defining the professional energy you carry right now",
    money:    "Influencing your current relationship with money and resources",
    home:     "Rooting your present home and family situation",
    spiritual:"Forming the spiritual lens through which you see this moment",
    general:  "Surrounding the heart of your question",
  },
  present: {
    love:     "A hidden dynamic asking for your honest attention in love",
    career:   "An unseen challenge or tension on your professional path",
    money:    "A financial complexity that deserves a clearer look",
    home:     "Something beneath the surface in your home or family life",
    spiritual:"A deeper truth quietly pressing for acknowledgment",
    general:  "A hidden influence shaping the situation around you",
  },
  future: {
    love:     "For your heart, the cards offer this guidance",
    career:   "On your professional path, the direction ahead holds",
    money:    "Financially, the oracle points toward",
    home:     "For your home and family, the advice offered is",
    spiritual:"On your soul's journey, the illumination ahead is",
    general:  "The path forward the cards are illuminating for you",
  },
};

// ── Suit-based category fallback for minor arcana ──────────────────────────

const SUIT_CATEGORY: Record<string, QuestionCategory> = {
  wands:     "career",
  pentacles: "money",
  swords:    "general",
  cups:      "love",
  major:     "general",
};

// ── Pull the most relevant meaning for a card + question context ───────────

function selectMeaning(card: TarotCard, category: QuestionCategory): string {
  // Major arcana have rich life-area fields — use them directly
  if (card.suit === "major") {
    const specific: Record<QuestionCategory, string | undefined> = {
      love:     card.love,
      career:   card.career,
      money:    card.money,
      home:     card.home,
      spiritual:card.spiritual,
      general:  card.upright,
    };
    return specific[category] ?? card.upright;
  }

  // Minor arcana: use the matching life-area field when the suit aligns with
  // the question category, otherwise fall back to upright
  const suitDefault = SUIT_CATEGORY[card.suit];
  const targetField: Record<QuestionCategory, string> = {
    love:     card.love,
    career:   card.career,
    money:    card.money,
    home:     card.home,
    spiritual:card.spiritual,
    general:  card.upright,
  };

  // Prefer the life-area field that matches the question
  return targetField[category] ?? targetField[suitDefault] ?? card.upright;
}

// ── Closing reflection phrases (position × category) ──────────────────────

const REFLECTIONS: Record<Position, Record<QuestionCategory, string>> = {
  past: {
    love:     "Reflect on how this energy has shaped what you seek or guard in love.",
    career:   "Consider how this foundation is still influencing the professional choices before you.",
    money:    "Notice how this pattern around money may be quietly driving your current decisions.",
    home:     "This root energy in your home life is still present — honour or release it with intention.",
    spiritual:"This is the spiritual soil from which your current questions are growing.",
    general:  "This energy is not behind you — it is the ground you are standing on.",
  },
  present: {
    love:     "Rather than avoiding this, ask yourself what it reveals about what you truly need.",
    career:   "Bringing this into conscious awareness is the first step toward resolving it.",
    money:    "Facing this complexity honestly opens up options you cannot see while looking away.",
    home:     "Acknowledging this beneath-the-surface tension makes it possible to address it directly.",
    spiritual:"This challenge is not an obstacle to your growth — it is part of it.",
    general:  "The cards invite you to look at this honestly rather than around it.",
  },
  future: {
    love:     "Trust this guidance and let it inform how you open — or protect — your heart going forward.",
    career:   "Let this direction orient your next professional move, however small.",
    money:    "One practical step aligned with this guidance could shift your financial trajectory.",
    home:     "Carry this into your home and family life as a quiet, steady compass.",
    spiritual:"This is not a prediction but an invitation — the next step on your inner path.",
    general:  "This is not the full picture of what comes next, but it is the most important piece right now.",
  },
};

// ── Reversed flag (30% chance per card, deterministic from card id + draw index) ──

function shouldReverse(cardId: number, drawIndex: number): boolean {
  // Deterministic so the same draw always gives the same result within a session
  return (cardId * 7 + drawIndex * 13) % 10 < 3;
}

// ── Main exported function ─────────────────────────────────────────────────

export interface CardReading {
  intro: string;         // position label sentence
  meaning: string;       // the personalised card meaning
  reflection: string;    // closing guidance sentence
  isReversed: boolean;
  reversedNote: string;  // short note when reversed
}

export function generateReading(
  question: string,
  cards: [TarotCard, TarotCard, TarotCard]
): [CardReading, CardReading, CardReading] {
  const category = categorizeQuestion(question);
  const positions: Position[] = ["past", "present", "future"];

  return positions.map((pos, i) => {
    const card  = cards[i];
    const reversed = shouldReverse(card.id, i);
    const meaning  = reversed
      ? card.reversed
      : selectMeaning(card, category);

    return {
      intro:       FRAMES[pos][category],
      meaning,
      reflection:  REFLECTIONS[pos][category],
      isReversed:  reversed,
      reversedNote: reversed ? "Reversed — read as a blockage, inner tension, or shadow aspect." : "",
    };
  }) as [CardReading, CardReading, CardReading];
}
