import type { MbtiScores } from "@/types";

/**
 * Compute cosine similarity between two MBTI score vectors.
 * Converts scores to 4D vectors: [E-I, S-N, T-F, J-P]
 * Returns normalized similarity in 0-1 range.
 */
export function computeMbtiSimilarity(
  scoresA: MbtiScores,
  scoresB: MbtiScores,
): number {
  const vectorA = buildVector(scoresA);
  const vectorB = buildVector(scoresB);

  const dotProduct = vectorA.reduce(
    (sum, a, i) => sum + a * vectorB[i],
    0,
  );
  const magnitudeA = Math.sqrt(
    vectorA.reduce((sum, a) => sum + a * a, 0),
  );
  const magnitudeB = Math.sqrt(
    vectorB.reduce((sum, b) => sum + b * b, 0),
  );

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0.5;
  }

  const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);

  // Normalize from [-1, 1] to [0, 1]
  return (cosineSimilarity + 1) / 2;
}

function buildVector(scores: MbtiScores): [number, number, number, number] {
  const eiDiff = (scores.E ?? 0) - (scores.I ?? 0);
  const snDiff = (scores.S ?? 0) - (scores.N ?? 0);
  const tfDiff = (scores.T ?? 0) - (scores.F ?? 0);
  const jpDiff = (scores.J ?? 0) - (scores.P ?? 0);

  return [eiDiff, snDiff, tfDiff, jpDiff];
}
