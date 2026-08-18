export type CheckStatus = "pass" | "warn" | "fail";

export interface Check {
  label: string;
  status: CheckStatus;
  note: string;
}

export interface AnalysisResult {
  score: number;
  tier: "COOKED" | "UNDERCOOKED" | "BURNT";
  angle: number;
  roast: string;
  checks: Check[];
}

const BUZZWORDS = [
  "synergy", "synergized", "results-driven", "team player", "hardworking",
  "detail-oriented", "go-getter", "think outside the box", "dynamic",
  "passionate", "proactive", "self-starter", "strategic thinker",
  "hard worker", "people person", "fast learner", "excellent communication",
  "works well under pressure"
];

const ACTION_VERBS = [
  "led", "built", "launched", "drove", "increased", "reduced", "designed",
  "created", "managed", "delivered", "shipped", "architected", "scaled",
  "negotiated", "grew", "cut", "saved", "generated", "improved", "automated",
  "spearheaded", "founded", "implemented", "optimized", "developed",
  "collaborated", "facilitated", "analyzed", "established", "formulated",
  "coordinated", "monitored", "executed", "conducted", "presented",
  "incorporated", "boosted", "devised", "removed", "utilized", "enabled",
  "enable", "integrated", "integrate", "ensured", "ensure", "allowed",
  "allow", "coded", "deployed", "engineered", "crafted", "pioneered",
  "transformed", "mentored", "structured", "strengthened", "streamlined"
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function analyzeResume(rawText: string): AnalysisResult {
  const text = rawText.replace(/\r/g, "");
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const cleanTextForQuantifiers = text
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "")
    .replace(/(\+?\d[\d\s\-().]{8,}\d)/g, "");

  const quantifierMatches = (
    cleanTextForQuantifiers.match(/\d+%|\$\d[\d,]*|\b\d+x\b|\b\d+\+|\bover \d+\b|\b\d{2,}\b/gi) || []
  ).filter((m) => {
    const digits = m.replace(/[^\d]/g, "");
    if (digits.length === 4 && (digits.startsWith("19") || digits.startsWith("20"))) {
      return false;
    }
    return true;
  });
  const quantifierCount = quantifierMatches.length;

  const buzzwordHits = BUZZWORDS.filter((b) => lower.includes(b));
  const buzzwordCount = buzzwordHits.length;

  const bulletLines = text
    .split("\n")
    .filter((l) => /^\s*[-•*●■▪◦○♦✓\u2022\u25cf\u25a0\u25aa\u25e6\u25cb]/.test(l) || /^\s*\d+[.)]/.test(l));

  const actionVerbBullets = bulletLines.filter((l) => {
    const cleanedLine = l.replace(/^[^a-zA-Z]+/, "");
    const firstWord = cleanedLine.trim().split(/\s+/)[0]?.toLowerCase() || "";
    const cleanWord = firstWord.replace(/[^a-z]/g, "");
    return ACTION_VERBS.includes(cleanWord);
  });

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s\-().]{8,}\d)/.test(text);

  const checks: Check[] = [];
  let score = 100;

  if (wordCount < 120) {
    score -= 22;
    checks.push({
      label: "Length",
      status: "fail",
      note: `only ${wordCount} words — undercooked, needs more substance`
    });
  } else if (wordCount > 900) {
    score -= 14;
    checks.push({
      label: "Length",
      status: "warn",
      note: `${wordCount} words — running long, trim the fat`
    });
  } else {
    checks.push({
      label: "Length",
      status: "pass",
      note: `${wordCount} words — reasonable portion size`
    });
  }

  if (quantifierCount === 0) {
    score -= 24;
    checks.push({
      label: "Quantified proof",
      status: "fail",
      note: "zero numbers found — no evidence behind the claims"
    });
  } else if (quantifierCount < 3) {
    score -= 10;
    checks.push({
      label: "Quantified proof",
      status: "warn",
      note: `only ${quantifierCount} number(s) — could use more receipts`
    });
  } else {
    checks.push({
      label: "Quantified proof",
      status: "pass",
      note: `${quantifierCount} quantified results found`
    });
  }

  if (buzzwordCount > quantifierCount * 1.5 && buzzwordCount >= 2) {
    score -= 18;
    checks.push({
      label: "Bluff detector",
      status: "fail",
      note: `"${buzzwordHits.slice(0, 3).join('", "')}" — seasoning with no substance underneath`
    });
  } else if (buzzwordCount > 0) {
    score -= 6;
    checks.push({
      label: "Bluff detector",
      status: "warn",
      note: `a little cliché (${buzzwordHits.slice(0, 2).join(", ")}) but backed by some proof`
    });
  } else {
    checks.push({
      label: "Bluff detector",
      status: "pass",
      note: "no empty buzzwords detected"
    });
  }

  if (bulletLines.length > 0) {
    const ratio = actionVerbBullets.length / bulletLines.length;
    if (ratio < 0.3) {
      score -= 16;
      checks.push({
        label: "Bullet strength",
        status: "fail",
        note: "most bullets don't open with a strong action verb"
      });
    } else if (ratio < 0.6) {
      score -= 6;
      checks.push({
        label: "Bullet strength",
        status: "warn",
        note: "mixed — some bullets are passive"
      });
    } else {
      checks.push({
        label: "Bullet strength",
        status: "pass",
        note: "bullets lead with strong action verbs"
      });
    }
  } else {
    score -= 10;
    checks.push({
      label: "Bullet strength",
      status: "warn",
      note: "no clear bullet structure detected"
    });
  }

  if (!hasEmail || !hasPhone) {
    score -= 8;
    checks.push({
      label: "Contact info",
      status: "warn",
      note: "missing email or phone — recruiter can't reach you"
    });
  } else {
    checks.push({
      label: "Contact info",
      status: "pass",
      note: "email and phone present"
    });
  }

  score = Math.max(4, Math.min(96, score));

  let tier: AnalysisResult["tier"];
  let angle: number;
  let roast: string;

  if (score >= 70) {
    tier = "COOKED";
    angle = 155;
    roast = pick([
      "Plated and ready to serve. Send it.",
      "This one's done — good sear, solid proof throughout.",
      "Cooked through. A recruiter would actually finish reading this."
    ]);
  } else if (score >= 40) {
    tier = "UNDERCOOKED";
    angle = 95;
    roast = pick([
      "Good ingredients, needs more time on the proof.",
      "There's a real resume in here — it just needs more numbers, less seasoning.",
      "Middle of the pan. A few more passes and this is ready."
    ]);
  } else {
    tier = "BURNT";
    angle = 25;
    roast = pick([
      "This got left on the heat too long. Start a fresh bullet list.",
      "Mostly buzzwords, barely any receipts. Send it back to the kitchen.",
      "Burnt — heavy on claims, empty on proof."
    ]);
  }

  return { score, tier, angle, roast, checks };
}
