export interface MbtiScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

export type MbtiDimension = "EI" | "SN" | "TF" | "JP";
export type MbtiType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export interface BottlePayload {
  content: string;
  visibility: "public" | "private";
  allowComments: boolean;
}

export interface CommentPayload {
  bottleId: string;
  content: string;
}

export interface MbtiAnswerPayload {
  questionId: string;
  dimension: MbtiDimension;
  score: number;
}

export interface MbtiStatus {
  type: MbtiType | null;
  confidence: number;
  totalAnswers: number;
  scores: MbtiScores | null;
}

export interface BottleFeedItem {
  id: string;
  bottleStyle: number;
  thrownAt: string;
  user: { nickname: string; mbtiType: string | null };
}

export interface BottleDetail {
  id: string;
  content: string;
  visibility: string;
  allowComments: boolean;
  openCount: number;
  thrownAt: string;
  isOwner: boolean;
  user: { nickname: string; mbtiType: string | null };
  comments: {
    id: string; content: string; createdAt: string;
    commenter: { nickname: string };
  }[];
}
