import type { MbtiScores, MbtiType } from "@/types";
import { prisma } from "@/lib/prisma";

interface ScoreResult {
  scores: MbtiScores;
  type: MbtiType;
  confidence: number;
}

/**
 * Derive the 4-letter MBTI type from MbtiScores.
 * Positive score in a dimension → first letter, negative → second letter.
 */
function deriveType(scores: MbtiScores): MbtiType {
  const eOrI = scores.E >= scores.I ? "E" : "I";
  const sOrN = scores.S >= scores.N ? "S" : "N";
  const tOrF = scores.T >= scores.F ? "T" : "F";
  const jOrP = scores.J >= scores.P ? "J" : "P";

  return `${eOrI}${sOrN}${tOrF}${jOrP}` as MbtiType;
}

/**
 * Normalize each dimension pair so they sum to 1.
 * Returns a new MbtiScores object — immutable.
 */
function normalizeScores(scores: MbtiScores): MbtiScores {
  const eiTotal = scores.E + scores.I || 1;
  const snTotal = scores.S + scores.N || 1;
  const tfTotal = scores.T + scores.F || 1;
  const jpTotal = scores.J + scores.P || 1;

  return {
    E: scores.E / eiTotal,
    I: scores.I / eiTotal,
    S: scores.S / snTotal,
    N: scores.N / snTotal,
    T: scores.T / tfTotal,
    F: scores.F / tfTotal,
    J: scores.J / jpTotal,
    P: scores.P / jpTotal,
  };
}

/**
 * Compute MBTI scores, type, and confidence from a user's answer history.
 */
export async function computeScores(userId: string): Promise<ScoreResult> {
  const answers = await prisma.mbtiAnswer.findMany({
    where: { userId },
  });

  if (answers.length === 0) {
    const emptyScores: MbtiScores = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
    };
    return {
      scores: emptyScores,
      type: "INTJ",
      confidence: 0,
    };
  }

  // Aggregate raw scores per letter
  const raw: Record<string, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  };

  const dimensionCount: Record<string, number> = {
    EI: 0, SN: 0, TF: 0, JP: 0,
  };

  for (const answer of answers) {
    dimensionCount[answer.dimension] = (dimensionCount[answer.dimension] ?? 0) + 1;

    const [first, second] = answer.dimension.split("") as [string, string];

    if (answer.score > 0) {
      raw[first] = (raw[first] ?? 0) + answer.score;
    } else if (answer.score < 0) {
      raw[second] = (raw[second] ?? 0) + Math.abs(answer.score);
    }
    // score === 0 contributes nothing
  }

  const scores: MbtiScores = {
    E: raw.E ?? 0,
    I: raw.I ?? 0,
    S: raw.S ?? 0,
    N: raw.N ?? 0,
    T: raw.T ?? 0,
    F: raw.F ?? 0,
    J: raw.J ?? 0,
    P: raw.P ?? 0,
  };

  const normalized = normalizeScores(scores);
  const type = deriveType(normalized);

  // Confidence: coverage factor (max 20 answers for full coverage) * 0.7
  // + spread factor (how decisive each dimension is) * 0.3
  const totalAnswered = answers.length;
  const coverageConfidence = Math.min(totalAnswered / 20, 1);

  const eiSpread = Math.abs(normalized.E - normalized.I);
  const snSpread = Math.abs(normalized.S - normalized.N);
  const tfSpread = Math.abs(normalized.T - normalized.F);
  const jpSpread = Math.abs(normalized.J - normalized.P);
  const spreadConfidence = (eiSpread + snSpread + tfSpread + jpSpread) / 4;

  const confidence = coverageConfidence * 0.7 + spreadConfidence * 0.3;

  return { scores: normalized, type, confidence };
}
