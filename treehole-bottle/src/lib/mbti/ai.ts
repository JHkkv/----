import type { MbtiScores, MbtiType } from "@/types";

interface AnalysisResult {
  scores: MbtiScores;
  confidence: number;
}

function deriveType(scores: MbtiScores): MbtiType {
  const eOrI = scores.E >= scores.I ? "E" : "I";
  const sOrN = scores.S >= scores.N ? "S" : "N";
  const tOrF = scores.T >= scores.F ? "T" : "F";
  const jOrP = scores.J >= scores.P ? "J" : "P";
  return `${eOrI}${sOrN}${tOrF}${jOrP}` as MbtiType;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI analysis failed";
}

function parseMbtiFromAIResponse(responseText: string): {
  scores: MbtiScores;
  type: MbtiType;
  confidence: number;
} | null {
  try {
    const trimmed = responseText.trim();

    // Try to parse as JSON first
    // Format expected: { "E": 0.7, "I": 0.3, ... } or { "type": "INFJ", "confidence": 0.8 }
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // If it has a "type" field, map it to scores
      if (parsed.type && typeof parsed.type === "string") {
        const typeStr = parsed.type.toUpperCase();
        const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

        const typeMap: Record<string, MbtiScores> = {
          INTJ: { E: 0, I: 1, S: 0, N: 1, T: 1, F: 0, J: 1, P: 0 },
          INTP: { E: 0, I: 1, S: 0, N: 1, T: 1, F: 0, J: 0, P: 1 },
          ENTJ: { E: 1, I: 0, S: 0, N: 1, T: 1, F: 0, J: 1, P: 0 },
          ENTP: { E: 1, I: 0, S: 0, N: 1, T: 1, F: 0, J: 0, P: 1 },
          INFJ: { E: 0, I: 1, S: 0, N: 1, T: 0, F: 1, J: 1, P: 0 },
          INFP: { E: 0, I: 1, S: 0, N: 1, T: 0, F: 1, J: 0, P: 1 },
          ENFJ: { E: 1, I: 0, S: 0, N: 1, T: 0, F: 1, J: 1, P: 0 },
          ENFP: { E: 1, I: 0, S: 0, N: 1, T: 0, F: 1, J: 0, P: 1 },
          ISTJ: { E: 0, I: 1, S: 1, N: 0, T: 1, F: 0, J: 1, P: 0 },
          ISFJ: { E: 0, I: 1, S: 1, N: 0, T: 0, F: 1, J: 1, P: 0 },
          ESTJ: { E: 1, I: 0, S: 1, N: 0, T: 1, F: 0, J: 1, P: 0 },
          ESFJ: { E: 1, I: 0, S: 1, N: 0, T: 0, F: 1, J: 1, P: 0 },
          ISTP: { E: 0, I: 1, S: 1, N: 0, T: 1, F: 0, J: 0, P: 1 },
          ISFP: { E: 0, I: 1, S: 1, N: 0, T: 0, F: 1, J: 0, P: 1 },
          ESTP: { E: 1, I: 0, S: 1, N: 0, T: 1, F: 0, J: 0, P: 1 },
          ESFP: { E: 1, I: 0, S: 1, N: 0, T: 0, F: 1, J: 0, P: 1 },
        };

        if (typeStr in typeMap) {
          return {
            scores: typeMap[typeStr as keyof typeof typeMap],
            type: typeStr as MbtiType,
            confidence: Math.min(Math.max(confidence, 0), 1),
          };
        }
        return null;
      }

      // Check if direct dimension scores are provided
      const dims = parsed as Record<string, unknown>;
      if (
        typeof dims.E === "number" && typeof dims.I === "number" &&
        typeof dims.S === "number" && typeof dims.N === "number" &&
        typeof dims.T === "number" && typeof dims.F === "number" &&
        typeof dims.J === "number" && typeof dims.P === "number"
      ) {
        const scores: MbtiScores = {
          E: dims.E, I: dims.I,
          S: dims.S, N: dims.N,
          T: dims.T, F: dims.F,
          J: dims.J, P: dims.P,
        };
        const confidence = typeof dims.confidence === "number"
          ? Math.min(Math.max(dims.confidence, 0), 1)
          : 0.5;

        return { scores, type: deriveType(scores), confidence };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
  Analyze a user's emotional text to infer MBTI dimensions via Claude AI.
  Returns null if CLAUDE_API_KEY is not set or if the API call fails.
  This is a placeholder — the full Claude API integration can be added later.
 */
export async function analyzeEmotionForMbti(
  text: string,
): Promise<AnalysisResult | null> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const prompt = `You are an MBTI personality analyst. Analyze the following emotional personal text and infer the writer's MBTI dimensions.

For each dimension pair (E/I, S/N, T/F, J/P), provide a score from 0.0 to 1.0 for each letter, where the pair sums to 1.0.

Also provide a confidence score from 0.0 to 1.0.

Text to analyze:
"""
${text}
"""

Respond ONLY with a JSON object in this exact format:
{
  "E": 0.7, "I": 0.3,
  "S": 0.4, "N": 0.6,
  "T": 0.3, "F": 0.7,
  "J": 0.5, "P": 0.5,
  "confidence": 0.8
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 256,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const responseText = data?.content?.[0]?.text ?? "";

    if (!responseText) {
      return null;
    }

    const parsed = parseMbtiFromAIResponse(responseText);
    if (!parsed) {
      return null;
    }

    return {
      scores: parsed.scores,
      confidence: parsed.confidence,
    };
  } catch {
    return null;
  }
}
